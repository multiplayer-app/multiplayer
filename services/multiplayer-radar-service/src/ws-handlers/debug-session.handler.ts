import { Server, Socket, Namespace } from 'socket.io'
import type { Request } from 'express'
import logger from '@multiplayer/logger'
import { JoiValidator, Joi } from '@multiplayer/util'
import {
  SessionType,
} from '@multiplayer-app/session-recorder-node'
import {
  socketAuthorize,
  socketCookieParser,
  socketExpressSession,
} from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  WSCallback,
  DebugSessionEvents,
  DebugSessionEventsMap,
} from '@multiplayer/types'
import { WebSocketHelper } from '../helpers'

export class DebugSessionNamespaceHandler {
  private io: Server
  private namespace: Namespace

  constructor(io: Server) {
    this.io = io

    this.namespace = this.io.of(/^\/workspaces\/([a-fA-F0-9]{24})\/projects\/([a-fA-F0-9]{24})\/debug-sessions$/)
    // this.namespace = this.io.of('/')
    this.namespace.use(socketCookieParser)
    this.namespace.use(socketExpressSession)
    this.namespace.use(WebSocketHelper.extractIdsFromNamespace)
    this.namespace.use((socket: Socket, next) => socketAuthorize({
      entity: RoleProjectPermissionEntity.DEBUG_SESSION,
      action: RoleAccessAction.READ,
    }, {
      workspaceId: socket.data.workspaceId,
      projectId: socket.data.projectId,
    })(socket, next))
  }

  initialize() {
    this.namespace.on('connection', this.onConnect.bind(this))
  }

  emitMessageToRoom(
    workspaceId: string,
    projectId: string,
    room: string,
    event: string,
    data: any,
  ): void {
    const _namespaceName = `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions`

    this.io.of(_namespaceName).in(room).emit(
      event,
      data,
    )
    logger.debug({ room, event }, '[DEBUG_SESSION_WEBSOCKET] Emit message to room')
  }

  isSocketConnected(socketId: string): boolean {
    return this.namespace.adapter.rooms.has(socketId)
  }

  onConnect(socket) {
    socket.on(
      DebugSessionEvents.DEBUG_SESSION_DATA_SUBSCRIBE,
      (params, callback) => this.subscribeSessionDataEvents(socket, params, callback),
    )
    socket.on(
      DebugSessionEvents.DEBUG_SESSION_DATA_UNSUBSCRIBE,
      (params, callback) => this.unsubscribeSessionDataEvents(socket, params, callback),
    )
    socket.on(
      DebugSessionEvents.DEBUG_SESSION_SUBSCRIBE_PROJECT,
      (params, callback) => this.subscribeSessionInfoEventsInProject(socket, params, callback),
    )
    socket.on(
      DebugSessionEvents.DEBUG_SESSION_UNSUBSCRIBE_PROJECT,
      (params, callback) => this.unsubscribeSessionInfoEventsInProject(socket, params, callback),
    )
  }

  async subscribeSessionInfoEventsInProject(
    socket: Socket & { request: Request },
    data: DebugSessionEventsMap[DebugSessionEvents.DEBUG_SESSION_SUBSCRIBE_PROJECT]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          workspaceId: Joi.string().hex().required(),
          projectId: Joi.string().hex().required(),
        }),
      )

      const room = WebSocketHelper.getSessionRecordingRoomInProject(
        data.workspaceId,
        data.projectId,
      )

      socket.join(room)

      logger.debug({
        event: DebugSessionEvents.DEBUG_SESSION_SUBSCRIBE_PROJECT,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        room,
      }, '[WEBSOCKET] Joined room')

    } catch (error) {
      logger.error(
        error,
        {
          event: DebugSessionEvents.DEBUG_SESSION_SUBSCRIBE_PROJECT,
        },
        '[WEBSOCKET] Error in event handler',
      )
    }
  }

  async unsubscribeSessionInfoEventsInProject(
    socket: Socket & { request: Request },
    data: DebugSessionEventsMap[DebugSessionEvents.DEBUG_SESSION_UNSUBSCRIBE_PROJECT]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          workspaceId: Joi.string().hex().required(),
          projectId: Joi.string().hex().required(),
        }),
      )

      socket.leave(WebSocketHelper.getSessionRecordingRoomInProject(
        data.workspaceId,
        data.projectId,
      ))

      logger.debug({
        event: DebugSessionEvents.DEBUG_SESSION_UNSUBSCRIBE_PROJECT,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
      }, '[WEBSOCKET] Left room')

    } catch (error) {
      logger.error(
        error,
        {
          event: DebugSessionEvents.DEBUG_SESSION_UNSUBSCRIBE_PROJECT,
        },
        '[WEBSOCKET] Error in event handler',
      )
    }
  }

  async subscribeSessionDataEvents(
    socket: Socket & { request: Request },
    data: DebugSessionEventsMap[DebugSessionEvents.DEBUG_SESSION_DATA_SUBSCRIBE]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          workspaceId: Joi.string().hex().required(),
          projectId: Joi.string().hex().required(),
          debugSessionId: Joi.string().required(),
          debugSessionType: Joi.string()
            .allow(...Object.values(SessionType)),
        }),
      )

      socket.join(WebSocketHelper.getSessionRecordingDataRoomById(data.debugSessionId))

      logger.debug({
        event: DebugSessionEvents.DEBUG_SESSION_DATA_SUBSCRIBE,
        debugSessionId: data.debugSessionId,
      }, '[WEBSOCKET] Joined room')
    } catch (error) {
      logger.error(
        error,
        {
          event: DebugSessionEvents.DEBUG_SESSION_DATA_SUBSCRIBE,
        },
        '[WEBSOCKET] Error in event handler',
      )
    }
  }

  async unsubscribeSessionDataEvents(
    socket: Socket & { request: Request },
    data: DebugSessionEventsMap[DebugSessionEvents.DEBUG_SESSION_DATA_UNSUBSCRIBE]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          debugSessionId: Joi.string().required(),
        }),
      )

      socket.leave(WebSocketHelper.getSessionRecordingDataRoomById(data.debugSessionId))

      logger.debug({
        event: DebugSessionEvents.DEBUG_SESSION_DATA_UNSUBSCRIBE,
        debugSessionId: data.debugSessionId,
      }, '[WEBSOCKET] Left room')
    } catch (error) {
      logger.error(
        error,
        {
          event: DebugSessionEvents.DEBUG_SESSION_DATA_UNSUBSCRIBE,
        },
        '[WEBSOCKET] Error in event handler',
      )
    }
  }
}
