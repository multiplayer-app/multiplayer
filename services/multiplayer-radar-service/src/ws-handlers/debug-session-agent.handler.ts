import { Server, Socket, Namespace } from 'socket.io'
import { JoiValidator, Joi } from '@multiplayer/util'
import type { Request } from 'express'
import {
  SessionType,
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
  ATTR_MULTIPLAYER_SESSION_CLIENT_ID,
} from '@multiplayer-app/session-recorder-node'
import logger from '@multiplayer/logger'
import {
  DebugSessionAgentEventsMap,
  DebugSessionAgentEvents,
  DebugSessionEvents,
  WSCallback,
  EndUserType,
  EndUserState,
  EndUserEvents,
  ErrorMessage,
  SessionRecordingMode,
  CommonEvents,
  IntegrationTypeEnum,
  IDebugSessionRrwebEvent,
} from '@multiplayer/types'
import {
  socketAuthorize,
  socketCookieParser,
  socketExpressSession,
} from '@multiplayer/auth'
import {
  EndUserModel,
  IEndUserDocument,
} from '@multiplayer/models'
import { ClientIdSocketCache } from '../cache'
import {
  DebugSessionService,
  EndUserService,
  IntegrationService,
  ContinuousDebugSessionService,
} from '../services'
import {
  WebSocketHelper,
} from '../helpers'
import {
  debugSessionNamespaceHandler,
  endUserNamespaceHandler,
} from '../websocket'

export class DebugSessionAgentNamespaceHandler {
  private io: Server
  private namespace: Namespace

  constructor(io: Server) {
    this.io = io

    this.namespace = this.io.of('/')
    this.namespace.use(socketCookieParser)
    this.namespace.use(socketExpressSession)
    this.namespace.use((socket, next) => socketAuthorize({}, {})(socket, next))
    this.namespace.use(async (socket, next) => {
      if (
        (
          ((socket.request as Request).rawApiKeyPayload?.type !== IntegrationTypeEnum.OTEL)
          && ((socket.request as Request).rawApiKeyPayload?.type !== IntegrationTypeEnum.OTEL_FRONTEND)
        )
        || !(socket.request as Request).rawApiKeyPayload?.workspace
        || !(socket.request as Request).rawApiKeyPayload?.project
        || !(socket.request as Request).rawApiKeyPayload?.integration
      ) {
        socket.emit(
          CommonEvents.ERROR,
          {
            code: ErrorMessage.NO_ACCESS_TO_THE_RESOURCE,
            message: 'Unauthorized',
          },
        );

        (socket as Socket).disconnect()
        logger.warn('[DEBUG_SESSION_AGENT_WEBSOCKET] Somebody tried to connect with invalid key')
        return next()
      }

      socket.data.clientId = socket.handshake.auth?.[ATTR_MULTIPLAYER_SESSION_CLIENT_ID]

      const endUser = await this.handleEndUserConnected(socket as any)

      if (!endUser) {
        socket.emit(
          CommonEvents.ERROR,
          {
            code: ErrorMessage.NO_ACCESS_TO_THE_RESOURCE,
            message: 'Unauthorized',
          },
        );

        (socket as Socket).disconnect()
        logger.warn('[DEBUG_SESSION_AGENT_WEBSOCKET] Failed to create end user for connected socket')
        return next()
      }

      return next()
    })
  }

  initialize() {
    this.namespace.on('connection', this.onConnect.bind(this))
  }

  emitMessageToRoom(
    room: string,
    event: string,
    data: any,
  ): void {
    this.namespace.in(room).emit(
      event,
      data,
    )
    logger.debug({ room, event }, '[DEBUG_SESSION_AGENT_WEBSOCKET] Emit message to room')
  }

  isSocketConnected(socketId: string): boolean {
    return this.namespace.adapter.rooms.has(socketId)
  }

  onConnect(socket) {
    socket.once('disconnect', (reason) => { this.handleEndUserDisconnected(socket, reason) })

    socket.on(
      DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE,
      (params, callback) => this.saveRrwebEvent(socket, params, callback),
    )
    socket.on(
      DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE_DEPRECATED,
      (params, callback) => this.saveRrwebEvent(socket, params, callback),
    )
    socket.on(
      DebugSessionAgentEvents.DEBUG_SESSION_STARTED,
      (params, callback) => this.handleEndUserStartedRecordingSessionRecording(socket, params, callback),
    )
    socket.on(
      DebugSessionAgentEvents.DEBUG_SESSION_STOPPED,
      (params, callback) => this.handleEndUserStoppedRecordingSessionRecording(socket, params, callback),
    )
    socket.on(
      DebugSessionAgentEvents.DEBUG_SESSION_SUBSCRIBE,
      (params, callback) => this.subscribeSessionInfoEvents(socket, params, callback),
    )
    socket.on(
      DebugSessionAgentEvents.DEBUG_SESSION_UNSUBSCRIBE,
      (params, callback) => this.unsubscribeSessionInfoEvents(socket, params, callback),
    )

    socket.on(
      DebugSessionAgentEvents.SET_USER_EVENT,
      (params, callback) => this.setUserForSocket(socket, params, callback),
    )

    socket.emit(
      'ready',
      { ready: true },
    )
  }


  async saveRrwebEvent(
    socket: Socket & { request: Request },
    data: DebugSessionAgentEventsMap[DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          workspace: Joi.string().hex(),
          project: Joi.string().hex(),
          debugSessionId: Joi.string().hex().required(),
          eventType: Joi.number().required(),
          event: Joi.string().required(),
          timestamp: Joi.date(),
          debugSessionType: Joi.string()
            .allow(...Object.values(SessionType))
            .required(),
        }),
      )

      // compatibility for long and short debug session ids
      let debugSessionId = data.debugSessionId

      const _data = {
        debugSessionId,
        workspaceId: socket.request.rawApiKeyPayload.workspace,
        projectId: socket.request.rawApiKeyPayload.project,
        data: data.event,
        type: data.eventType,
        timestamp: data.timestamp,
      }

      let savedRrwebEvent: IDebugSessionRrwebEvent[] = []

      if (
        !('debugSessionType' in data)
        || data.debugSessionType === SessionType.MANUAL
      ) {
        if (debugSessionId.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH) {
          debugSessionId = await DebugSessionService.getDebugSessionLongId(debugSessionId)
        }
        _data.debugSessionId = debugSessionId

        savedRrwebEvent = await DebugSessionService.createDebugSessionRrwebEvents([_data])
      } else if (data.debugSessionType === SessionType.CONTINUOUS) {
        savedRrwebEvent = await ContinuousDebugSessionService.createContinuousDebugSessionRrwebEvents([_data])
      }


      await IntegrationService.upsertOtelIntegrationStatus(
        socket.request.rawApiKeyPayload.integration as string,
        { rrwebEvents: true },
      )


      debugSessionNamespaceHandler.emitMessageToRoom(
        _data.workspaceId,
        _data.projectId,
        WebSocketHelper.getSessionRecordingDataRoomById(_data.debugSessionId),
        DebugSessionEvents.DEBUG_SESSION_RRWEB_EVENT_CREATED,
        {
          debugSessionId: _data.debugSessionId,
          data: savedRrwebEvent[0],
        },
      )
    } catch (error) {
      logger.error(
        {
          event: DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE,
          error,
        },
        '[DEBUG_SESSION_AGENT_WEBSOCKET] Error in event handler',
      )
    }
  }

  async setUserForSocket(
    socket: Socket & { request: Request },
    data: DebugSessionAgentEventsMap[DebugSessionAgentEvents.SET_USER_EVENT]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      const workspace = socket.request.rawApiKeyPayload?.workspace
      const project = socket.request.rawApiKeyPayload?.project

      if (!workspace || !project) {
        throw new Error('INVALID_ARGUMENTS')
      }

      const userAttributesSchema = Joi.object({
        type: Joi.string().valid(...Object.values(EndUserType)).required(),
        id: Joi.string(),
        name: Joi.string(),
        groupId: Joi.string(),
        groupName: Joi.string(),
        environment: Joi.string(),
        environmentSlug: Joi.string(),
        userEmail: Joi.string(),
        userId: Joi.string(),
        userName: Joi.string(),
        accountId: Joi.string(),
        accountName: Joi.string(),
        orgId: Joi.string(),
        orgName: Joi.string(),
        tags: Joi.array().items(Joi.string()),
      }).allow(null)

      data = JoiValidator.validate(
        data as object,
        Joi.alternatives().try(
          userAttributesSchema,
          Joi.object({
            clientId: Joi.string().required(),
            userAttributes: userAttributesSchema.required(),
          }),
        ),
      )

      const clientId = data && 'clientId' in data
        ? data.clientId
        : undefined
      const userAttributes = data && 'userAttributes' in data
        ? data.userAttributes
        : data

      const [_endUser] = await EndUserModel.findEndUsersBySocketId(socket.id)
      let endUser = _endUser
      let status = EndUserState.IDLE

      if (endUser) {
        socket.leave(WebSocketHelper.getEndUserSocketRoomInProject(
          workspace,
          project,
          endUser._id.toString(),
          socket.id,
        ))

        status = endUser.connections
          .find(connection => connection.socketId === socket.id)?.state || EndUserState.IDLE
      } else {
        const _endUser = await this.handleEndUserConnected.bind(this)(socket)

        if (!_endUser) {
          throw new Error('END_USER_NOT_FOUND')
        }

        endUser = _endUser
      }

      let newEndUser

      if (userAttributes === null) {
        await EndUserService.removeConnection(socket.id)

        if (endUser.attributes.type === EndUserType.VISITOR) {
          newEndUser = await EndUserService.createEndUser(
            {
              workspace: socket.request.rawApiKeyPayload?.workspace,
              project: socket.request.rawApiKeyPayload?.project,
              attributes: { type: EndUserType.VISITOR },
            },
            {
              socketId: socket.id,
              clientId,
              state: status,
            },
          )
        }
      } else if (userAttributes) {
        await EndUserService.removeConnection(socket.id)

        newEndUser = await EndUserService.createEndUser(
          {
            workspace,
            project,
            attributes: userAttributes,
          },
          {
            socketId: socket.id,
            clientId,
            state: status,
          },
        )

        await DebugSessionService.updateDebugSessionBySocketId(
          socket.id,
          {
            userAttributes: userAttributes || undefined,
          },
        )
      }

      if (newEndUser) {
        socket.join(
          WebSocketHelper.getEndUserSocketRoomInProject(
            workspace,
            project,
            newEndUser._id.toString(),
            socket.id,
          ),
        )

        const newEndUserObject = newEndUser.toObject()

        endUserNamespaceHandler.emitMessageToRoom(
          workspace,
          project,
          WebSocketHelper.getEndUserRoomInProject(workspace, project),
          EndUserEvents.END_USER_CONNECTION_STATE_UPDATE_EVENT,
          {
            data: {
              ...newEndUserObject,
              online: newEndUserObject.connections.length > 0,
            },
          },
        )
      }

      if (
        newEndUser?._id?.toString() !== endUser._id.toString()
      ) {
        const endUserObject = endUser.toObject()
        endUserNamespaceHandler.emitMessageToRoom(
          workspace,
          project,
          WebSocketHelper.getEndUserRoomInProject(workspace, project),
          EndUserEvents.END_USER_CONNECTION_STATE_UPDATE_EVENT,
          {
            data: {
              ...endUserObject,
              online: endUserObject.connections.length > 0,
            },
          },
        )
      }

      if (clientId && socket.id) {
        await ClientIdSocketCache.set(clientId, socket.id)
      }
    } catch (error) {
      logger.error(
        error,
        {
          data,
          event: DebugSessionAgentEvents.SET_USER_EVENT,
        },
        '[DEBUG_SESSION_AGENT_WEBSOCKET] Error in event handler',
      )
    }
  }



  async handleEndUserStartedRecordingSessionRecording(
    socket: Socket & { request: Request },
    data: DebugSessionAgentEventsMap[DebugSessionAgentEvents.DEBUG_SESSION_STARTED]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          debugSessionId: Joi.string().hex().required(),
        }),
      )

      const debugSession = await DebugSessionService.addSocketIdToDebugSession(
        socket.request.rawApiKeyPayload.workspace,
        socket.request.rawApiKeyPayload.project,
        socket.id,
        data.debugSessionId,
      )

      const endUser = await EndUserService.updateEndUserStateBySocketId(
        socket.id,
        {
          state: EndUserState.RECORDING,
          recordingMode: debugSession?.continuousDebugSession
            ? SessionRecordingMode.CONTINUOUS
            : SessionRecordingMode.MANUAL,
          sessionRecording: (debugSession as any)?._id?.toString(),
        },
      )

      if (endUser) {
        const endUserObject = endUser.toObject()

        endUserNamespaceHandler.emitMessageToRoom(
          socket.request.rawApiKeyPayload.workspace,
          socket.request.rawApiKeyPayload.project,
          WebSocketHelper.getEndUserRoomInProject(
            socket.request.rawApiKeyPayload.workspace,
            socket.request.rawApiKeyPayload.project,
          ),
          EndUserEvents.END_USER_CONNECTION_STATE_UPDATE_EVENT,
          {
            data: {
              ...endUserObject,
              online: endUserObject.connections.length > 0,
            },
          },
        )
      }
    } catch (error) {
      logger.error(
        error,
        {
          event: DebugSessionAgentEvents.DEBUG_SESSION_STARTED,
        },
        '[DEBUG_SESSION_AGENT_WEBSOCKET] Error in event handler',
      )
    }
  }


  async handleEndUserStoppedRecordingSessionRecording(
    socket: Socket & { request: Request },
    data: DebugSessionAgentEventsMap[DebugSessionAgentEvents.DEBUG_SESSION_STOPPED]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      if (
        !socket.request.rawApiKeyPayload?.workspace
        || !socket.request.rawApiKeyPayload?.project
      ) {
        throw new Error('Workspace and project are required')
      }

      const {
        workspace,
        project,
      } = socket.request.rawApiKeyPayload

      await DebugSessionService.removeSocketIdFromDebugSession(socket.id)

      const endUser = await EndUserService.updateEndUserStateBySocketId(
        socket.id,
        {
          state: EndUserState.IDLE,
        },
      )

      if (endUser) {
        const endUserObject = endUser.toObject()
        endUserNamespaceHandler.emitMessageToRoom(
          workspace,
          project,
          WebSocketHelper.getEndUserRoomInProject(workspace, project),
          EndUserEvents.END_USER_CONNECTION_STATE_UPDATE_EVENT,
          {
            data: {
              ...endUserObject,
              online: endUserObject.connections.length > 0,
            },
          },
        )
      }
    } catch (error) {
      logger.error(
        error,
        {
          event: DebugSessionAgentEvents.DEBUG_SESSION_STOPPED,
        },
        '[DEBUG_SESSION_AGENT_WEBSOCKET] Error in event handler',
      )
    }
  }


  async handleEndUserConnected(
    socket: Socket & { request: Request },
    callback?: WSCallback<void>,
  ): Promise<IEndUserDocument | undefined> {
    try {
      const {
        workspace,
        project,
      } = socket.request.rawApiKeyPayload
      const clientId = socket.handshake.auth?.[ATTR_MULTIPLAYER_SESSION_CLIENT_ID]

      const endUser = await EndUserService.createEndUser(
        {
          workspace,
          project,
          attributes: {
            type: EndUserType.VISITOR,
          },
        },
        {
          socketId: socket.id,
          clientId,
          state: EndUserState.IDLE,
        },
      )

      const endUserObject = endUser.toObject()

      socket.join(
        WebSocketHelper.getEndUserSocketRoomInProject(
          workspace,
          project,
          endUser._id.toString(),
          socket.id,
        ),
      )

      endUserNamespaceHandler.emitMessageToRoom(
        workspace,
        project,
        WebSocketHelper.getEndUserRoomInProject(
          workspace,
          project,
        ),
        EndUserEvents.END_USER_CONNECTED_EVENT,
        {
          data: {
            ...endUserObject,
            online: endUserObject.connections.length > 0,
          },
        },
      )

      return endUser
    } catch (error) {
      logger.error(
        error,
        {
          event: EndUserEvents.END_USER_CONNECTED_EVENT,
        },
        '[DEBUG_SESSION_AGENT_WEBSOCKET] Error in event handler',
      )

      return undefined
    }
  }



  async handleEndUserDisconnected(
    socket: Socket & { request: Request },
    reason,
    callback?: WSCallback<void>,
  ) {
    try {
      const clientId = socket.data.clientId

      if (
        socket.request.rawApiKeyPayload?.workspace
        && socket.request.rawApiKeyPayload?.project
      ) {
        const endUser = await EndUserService.removeConnection(socket.id)
        await DebugSessionService.removeSocketIdFromDebugSession(socket.id)


        if (endUser) {
          const endUserObject = endUser.toObject()
          endUserNamespaceHandler.emitMessageToRoom(
            endUserObject.workspace,
            endUserObject.project,
            WebSocketHelper.getEndUserRoomInProject(
              endUserObject.workspace,
              endUserObject.project,
            ),
            EndUserEvents.END_USER_CONNECTION_STATE_UPDATE_EVENT,
            {
              data: {
                ...endUserObject,
                online: endUserObject.connections.length > 0,
              },
            },
          )
        }
      }

      if (clientId) {
        await ClientIdSocketCache.remove(clientId)
      }

      logger.debug(`[DEBUG_SESSION_AGENT_WEBSOCKET] Disconnected user ${socket.id}. Reason: ${reason}`)
    } catch (err) {
      logger.error(err, '[DEBUG_SESSION_AGENT_WEBSOCKET] Error on disconnect')
    }
  }

  async subscribeSessionInfoEvents(
    socket: Socket & { request: Request },
    data: DebugSessionAgentEventsMap[DebugSessionAgentEvents.DEBUG_SESSION_SUBSCRIBE]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          workspaceId: Joi.string().length(24).hex().required(),
          projectId: Joi.string().length(24).hex().required(),
          debugSessionId: Joi.string().required(),
          debugSessionType: Joi.string().allow(...Object.values(SessionType)),
        }),
      )

      if (
        socket.request.rawApiKeyPayload?.workspace !== data?.workspaceId
        || socket.request.rawApiKeyPayload?.project !== data?.projectId
      ) {
        logger.debug(
          { event: DebugSessionAgentEvents.DEBUG_SESSION_SUBSCRIBE },
          '[DEBUG_SESSION_AGENT_WEBSOCKET] User not authenticated.',
        )
        socket.emit(
          CommonEvents.ERROR,
          {
            code: ErrorMessage.NO_ACCESS_TO_THE_RESOURCE,
            message: 'Failed to subscribe to debug session',
          },
        )
        return
      }

      // compatibility for long and short debug session ids
      let debugSessionId = data.debugSessionId
      if (debugSessionId?.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH) {
        debugSessionId = await DebugSessionService.getDebugSessionLongId(debugSessionId)
      }

      // const req: any = {
      //   session: ctx.session,
      //   rawApiKeyPayload: ctx.rawApiKeyPayload,
      //   headers: {
      //     [AuthConfig.AUTH_HEADER_NAME]: ctx.apiKey,
      //     [AuthConfig.CURRENT_USER_HEADER_NAME]: ctx.currentUserId,
      //   },
      //   params: {
      //     workspaceId,
      //     projectId,
      //   },
      // }

      // await AccessControlContext.setAccessContextToReq(req as any)

      data.debugSessionType = data.debugSessionType || SessionType.MANUAL
      // let isAllowed = false

      // if (data.debugSessionType === SessionType.MANUAL) {
      //   req.params.debugSessionId = debugSessionId

      //   const entityAccessValidator = new AccessControlEntities.DebugSession(req)
      //   isAllowed = await entityAccessValidator.ability(RoleAccessAction.READ)
      // } else if (data.debugSessionType === SessionType.CONTINUOUS) {
      //   if (ctx.rawApiKeyPayload?.type === IntegrationTypeEnum.OTEL) {
      //     isAllowed = true
      //   } else {
      //     req.params.continuousDebugSessionId = debugSessionId

      //     const entityAccessValidator = new AccessControlEntities.ContinuousDebugSession(req)
      //     isAllowed = await entityAccessValidator.ability(RoleAccessAction.READ)
      //   }
      // }

      // if (!isAllowed) {
      //   logger.error({
      //     event: DebugSessionAgentEvents.DEBUG_SESSION_SUBSCRIBE,
      //     debugSessionId,
      //     debugSessionType: data.debugSessionType,
      //   }, '[WEBSOCKET] Failed to subscribe to debugSession')
      //   return
      // }

      if (!debugSessionId) {
        throw new Error('DEBUG_SESSION_NOT_FOUND')
      }

      socket.join(
        WebSocketHelper.getSessionRecordingRoomById(debugSessionId),
      )

      logger.debug({
        event: DebugSessionAgentEvents.DEBUG_SESSION_SUBSCRIBE,
        debugSessionId,
      }, '[DEBUG_SESSION_AGENT_WEBSOCKET] Joined room')
    } catch (error) {
      logger.error(
        error,
        { event: DebugSessionAgentEvents.DEBUG_SESSION_SUBSCRIBE },
        '[DEBUG_SESSION_AGENT_WEBSOCKET] Error in event handler',
      )
    }
  }


  async unsubscribeSessionInfoEvents(
    socket: Socket & { request: Request },
    data: DebugSessionAgentEventsMap[DebugSessionAgentEvents.DEBUG_SESSION_UNSUBSCRIBE]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          debugSessionId: Joi.string().required(),
        }),
      )

      let debugSessionId = data.debugSessionId

      if (debugSessionId?.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH) {
        debugSessionId = await DebugSessionService.getDebugSessionLongId(debugSessionId)
      }

      if (!debugSessionId) {
        throw new Error('Debug session not found')
      }

      socket.leave(WebSocketHelper.getSessionRecordingRoomById(debugSessionId))

      logger.debug({
        event: DebugSessionEvents.DEBUG_SESSION_UNSUBSCRIBE_PROJECT,
        debugSessionId,
      }, '[DEBUG_SESSION_AGENT_WEBSOCKET] Left room')
    } catch (error) {
      logger.error(
        error,
        {
          event: DebugSessionAgentEvents.DEBUG_SESSION_UNSUBSCRIBE,
        },
        '[DEBUG_SESSION_AGENT_WEBSOCKET] Error in event handler',
      )
    }
  }
}
