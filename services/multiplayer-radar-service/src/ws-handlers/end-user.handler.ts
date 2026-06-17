import { Server, Socket, Namespace } from 'socket.io'
import type { Request } from 'express'
import logger from '@multiplayer/logger'
import { JoiValidator, Joi } from '@multiplayer/util'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  WSCallback,
  EndUserEvents,
  EndUserEventsMap,
} from '@multiplayer/types'
import {
  socketAuthorize,
  socketCookieParser,
  socketExpressSession,
} from '@multiplayer/auth'
import { WebSocketHelper } from '../helpers'

export class EndUserNamespaceHandler {
  private io: Server
  private namespace: Namespace

  constructor(io: Server) {
    this.io = io

    this.namespace = this.io.of(/^\/workspaces\/([a-fA-F0-9]{24})\/projects\/([a-fA-F0-9]{24})\/end-users$/)
    // this.namespace = this.io.of('/')
    this.namespace.use(socketCookieParser)
    this.namespace.use(socketExpressSession)
    this.namespace.use(WebSocketHelper.extractIdsFromNamespace)
    this.namespace.use((socket, next) => socketAuthorize({
      entity: RoleProjectPermissionEntity.END_USER,
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
    const _namespaceName = `/workspaces/${workspaceId}/projects/${projectId}/end-users`

    this.io.of(_namespaceName).in(room).emit(
      event,
      data,
    )
    logger.debug({ room, event }, '[END_USER_WEBSOCKET] Emit message to room')
  }

  isSocketConnected(socketId: string): boolean {
    return this.namespace.adapter.rooms.has(socketId)
  }

  onConnect(socket) {
    socket.on(
      EndUserEvents.END_USER_SUBSCRIBE_PROJECT,
      (params, callback) => this.subscribeEndUserEventsInProject(socket, params, callback),
    )
    socket.on(
      EndUserEvents.END_USER_UNSUBSCRIBE_PROJECT,
      (params, callback) => this.unsubscribeEndUserEventsInProject(socket, params, callback),
    )
  }


  async subscribeEndUserEventsInProject(
    socket: Socket & { request: Request },
    data: EndUserEventsMap[EndUserEvents.END_USER_SUBSCRIBE_PROJECT]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          workspaceId: Joi.string().required(),
          projectId: Joi.string().required(),
        }),
      )

      socket.join(
        WebSocketHelper.getEndUserRoomInProject(
          data.workspaceId,
          data.projectId,
        ),
      )

      logger.debug({
        event: EndUserEvents.END_USER_SUBSCRIBE_PROJECT,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
      }, '[WEBSOCKET] Joined room')

    } catch (error) {
      logger.error(
        error,
        {
          event: EndUserEvents.END_USER_SUBSCRIBE_PROJECT,
        },
        '[WEBSOCKET] Error in event handler',
      )
    }
  }


  async unsubscribeEndUserEventsInProject(
    socket: Socket & { request: Request },
    data: EndUserEventsMap[EndUserEvents.END_USER_UNSUBSCRIBE_PROJECT]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          workspaceId: Joi.string().required(),
          projectId: Joi.string().required(),
        }),
      )

      socket.leave(
        WebSocketHelper.getEndUserRoomInProject(
          data.workspaceId,
          data.projectId,
        ),
      )

      logger.debug({
        event: EndUserEvents.END_USER_UNSUBSCRIBE_PROJECT,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
      }, '[WEBSOCKET] Left room')

    } catch (error) {
      logger.error(
        error,
        {
          event: EndUserEvents.END_USER_UNSUBSCRIBE_PROJECT,
        },
        '[WEBSOCKET] Error in event handler',
      )
    }
  }
}
