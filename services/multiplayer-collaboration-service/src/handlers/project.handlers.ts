import { Server, Socket } from 'socket.io'
import {
  fetchDefaultBranch,
  fetchProject,
  fetchWorkspaceUser,
  socketCheckPermissions,
} from '../middlewares/auth'
import { EntityHandler } from './entity.handler'
import logger from '@multiplayer/logger'
import { DefaultEventsMap } from 'socket.io'
import {
  RoleAccessAction,
  BranchDeletedMessage,
  BranchEvents,
  CallbackData,
  CommentCreatedMessage,
  CommentsEvents,
  CommitType,
  ContextLimitingEvents,
  EntityDeletedMessage,
  EntityEvents,
  EntityUpdatedMessage,
  ICommit,
  IEntity,
  IEntityCommit,
  IWorkspaceUser,
  PresenceEvents,
  ProjectClientEventsMap,
  ProjectServerEventsMap,
  Resolution,
  ThreadCreatedMessage,
  WarningEvents,
  RoleWorkspacePermissionEntity, RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { Observable } from 'lib0/observable'
import { projectStateController } from '../controllers/project-state-controller'
import { ProjectSocketData } from '../interfaces/project-socket-data'
import { CommentsHandler } from './comments.handler'
import { BroadcastHelper } from './broadcast.helper'
import { VersionController } from '../controllers/version-controller'
import { getProcessedError } from './error.callback.handler'
import { BadRequestError } from 'restify-errors'
import { socketAuthorize, socketCookieParser, socketExpressSession } from '@multiplayer/auth'

export type ProjectNsEmittedEvents =
  EntityEvents.ENTITY_DELETE |
  EntityEvents.ENTITY_RESET |
  EntityEvents.ENTITY_COMMIT |
  EntityEvents.ENTITY_GIT_COMMIT |
  WarningEvents.MERGE_FINISHED

export class ProjectNamespaceHandler extends Observable<ProjectNsEmittedEvents> {
  private io: Server<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>

  constructor(io:Server<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>) {
    super()
    this.io = io
  }

  initialize() {
    const dynamicNamespace = this.io.of(/^\/project\|.*$/)
    dynamicNamespace.use(socketCookieParser)
    dynamicNamespace.use(socketExpressSession)
    dynamicNamespace.use(fetchProject)
    dynamicNamespace.use((socket, next) => socketAuthorize({
      entity: RoleWorkspacePermissionEntity.PROJECT,
      action: RoleAccessAction.READ,
    }, {
      workspaceId: socket.data.workspaceId,
      projectId: socket.data.projectId,
    })(socket, next))
    dynamicNamespace.use(fetchDefaultBranch)
    dynamicNamespace.use(fetchWorkspaceUser)
    dynamicNamespace.use((socket, next) => {
      socketCheckPermissions({
        entity: RoleWorkspacePermissionEntity.PROJECT,
        action: RoleAccessAction.UPDATE,
      })(socket, (err: any) => {
        if (!err) {
          socket.data.allowEdit = true
        }

        return next()
      })
    })
    dynamicNamespace.on('connection', this.onConnect.bind(this))
  }

  onConnect(socket: Socket<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>) {
    if (!socket.data.projectId) {
      socket.disconnect()
      return
    }

    socket.on(ContextLimitingEvents.BRANCH_SUBSCRIBE, (branchId: string) => this.onBranchSubscribe(socket, branchId))
    socket.on(ContextLimitingEvents.BRANCH_UNSUBSCRIBE, (branchId: string) => this.onBranchUnsubscribe(socket, branchId))

    this.onUserJoinedProject(socket)
    socket.once('disconnect', () => { this.onUserLeftProject(socket) })

    const projectId = socket.data.projectId
    const entityHandler = new EntityHandler(socket)
    entityHandler.setListeners()
    entityHandler.on(EntityEvents.ENTITY_RESET, (entityId: string, branchId: string) => {
      this.emit(EntityEvents.ENTITY_RESET, [{ entityId, branchId, projectId }])
    })
    entityHandler.on(EntityEvents.ENTITY_COMMIT, (data: {
      entityId: string,
      branchId: string,
      message: string,
      label: string
    }, callback?: (data: CallbackData<void>) => void) => {
      const params = { ...data, type: CommitType.MANUAL }
      this.emit(EntityEvents.ENTITY_COMMIT, [params, callback])
    })

    const commentsHandler = new CommentsHandler(projectId, socket)
    commentsHandler.setListeners()
    socket.on(BranchEvents.MERGE, (params, callback) => this.onMerge(socket, params, callback))
    socket.on(BranchEvents.UPDATE, (params, callback) => this.onBranchUpdate(socket, params, callback))
  }

  async onBranchUpdate(socket: Socket<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>,
    params: {
      branchToUpdate: string,
      baseBranch: string,
      resolutions?: Record<string, Resolution>
    },
    callback?: (data: CallbackData<void>) => void) {
    if (!socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    if (!socket.data.user) {
      callback?.({ error: { status: 403, message: 'Action requires authorized access' } })
      return
    }
    try {
      const controller = new VersionController(socket.data.workspaceId, socket.data.projectId)
      const data = await controller.updateBranch({ ...params, initiatorId: socket.data.user._id })
      callback?.({ data: undefined })
      const broadcast = (params.branchToUpdate === socket.data.defaultBranchId) ?
        socket.broadcast :
        BroadcastHelper.getBranchBroadcast(socket, params.branchToUpdate)

      broadcast.emit(WarningEvents.MERGE_FINISHED, {
        projectBranchFrom: params.baseBranch,
        projectBranchTo: params.branchToUpdate,
      })
      this.emit(WarningEvents.MERGE_FINISHED, [params.branchToUpdate])

      if (data) {
        data.entityCommits.forEach((commit) => {
          this.emit(EntityEvents.ENTITY_RESET, [{
            entityId: commit.entity,
            branchId: commit.projectBranch,
            projectId: commit.project,
          }])
        })
      }
    } catch (err) {
      logger.error(err)
      if (err instanceof BadRequestError) {
        return callback?.({ error: { message: err.message, status: err.statusCode } })
      }

      return callback?.({ error: getProcessedError(err) })
    }
  }

  async onMerge(socket: Socket<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>,
    params: {
      projectBranchFrom: string,
      projectBranchTo: string,
      excludedEntities?: string[]
    },
    callback?: (data: CallbackData<void>) => void) {
    if (!socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    if (!socket.data.user) {
      callback?.({ error: { status: 403, message: 'Action requires authorized access' } })
      return
    }
    try {
      const controller = new VersionController(socket.data.workspaceId, socket.data.projectId)
      const { entityCommits } = await controller.merge({ ...params, initiatorId: socket.data.user._id })
      callback?.({ data: undefined })
      const broadcast = (params.projectBranchTo === socket.data.defaultBranchId) ?
        socket.broadcast :
        BroadcastHelper.getBranchBroadcast(socket, params.projectBranchTo)

      broadcast.emit(WarningEvents.MERGE_FINISHED, {
        projectBranchFrom: params.projectBranchFrom,
        projectBranchTo: params.projectBranchTo,
      })
      this.emit(WarningEvents.MERGE_FINISHED, [params.projectBranchTo])
      entityCommits.forEach((commit) => {
        this.emit(EntityEvents.ENTITY_RESET, [{
          entityId: commit.entity,
          branchId: commit.projectBranch,
          projectId: commit.project,
        }])
      })
    } catch (err) {
      if (err instanceof BadRequestError) {
        logger.error(JSON.stringify(err.body))
        return callback?.({ error: { message: err.message, status: err.statusCode } })
      }

      logger.error(err)
      return callback?.({ error: getProcessedError(err) })
    }
  }

  onUserLeftProject(socket: Socket<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>) {
    if (!socket.data.projectId || !socket.data.user) {
      return
    }
    logger.debug(`[Websocket] Disconnected user with id ${socket.data.user._id}`)
    projectStateController.onUserLeftProject(socket.data.projectId, socket.data.user._id)
    socket.broadcast.emit(PresenceEvents.USER_LEFT_PROJECT, socket.data.user._id)
  }

  onUserJoinedProject(socket: Socket<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>) {
    if (!socket.data.projectId || !socket.data.user) {
      return
    }
    const state = projectStateController.onUserJoinedProject(
      socket.data.projectId,
      socket.data.user)
    socket.emit(PresenceEvents.INIT_STATE, state)
    socket.broadcast.emit(PresenceEvents.USER_JOINED_PROJECT, socket.data.user)
  }

  onBranchSubscribe(socket: Socket<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>,
    branchId: string) {
    projectStateController.onUserJoinedBranch(
      socket.data.projectId,
      socket.data.user,
      branchId,
    )
    socket.join(BroadcastHelper.getBranchRoomName(branchId))
  }

  onBranchUnsubscribe(socket: Socket<ProjectClientEventsMap, ProjectServerEventsMap, DefaultEventsMap, ProjectSocketData>,
    branchId: string) {
    projectStateController.onUserLeftBranch(
      socket.data.projectId,
      socket.data.user,
    )
    socket.leave(BroadcastHelper.getBranchRoomName(branchId))
  }

  onEntityConnect(params: { user: IWorkspaceUser, entityId: string, branchId: string, projectId: string }) {
    const namespace = this.io.of(`/project|${params.projectId}`)
    namespace.emit(PresenceEvents.USER_JOINED_PROJECT, params.user)
    namespace.emit(PresenceEvents.USER_JOINED_ENTITY, params.user, params.entityId, params.branchId)
  }

  onEntityDisconnect(params: { userId: string, entityId: string, branchId: string, projectId: string }) {
    const namespace = this.io.of(`/project|${params.projectId}`)
    namespace.emit(PresenceEvents.USER_LEFT_ENTITY, params.userId, params.entityId, params.branchId)
  }

  onEntityUpdate(params: EntityUpdatedMessage) {
    const namespace = this.io.of(`/project|${params.entity.project}`)

    if (params.isDefaultBranch) {
      namespace.emit(EntityEvents.ENTITY_UPDATE, params.entity)
      return
    }
    namespace.to(BroadcastHelper.getBranchRoomName(params.entity.projectBranch))
      .emit(EntityEvents.ENTITY_UPDATE, params.entity)
  }

  onEntityCommit(params: {
    entityId: string,
    branchId: string,
    projectId: string,
    entityCommit: Omit<IEntityCommit, 'commit'> & { commit: ICommit }
  }) {
    const namespace = this.io.of(`/project|${params.projectId}`)
    namespace.to(BroadcastHelper.getBranchRoomName(params.branchId)).emit(EntityEvents.ENTITY_COMMIT, params.entityCommit)
  }

  onEntityCreated(params: { entityCommit: IEntityCommit; entity: IEntity, isDefaultBranch: boolean }) {
    const namespace = this.io.of(`/project|${params.entity.project}`)
    if (params.isDefaultBranch) {
      namespace.emit(EntityEvents.ENTITY_CREATE, {
        entity: params.entity,
        entityCommit: params.entityCommit,
      })
      return
    }
    namespace.to(BroadcastHelper.getBranchRoomName(params.entity.projectBranch))
      .emit(EntityEvents.ENTITY_CREATE, {
        entity: params.entity,
        entityCommit: params.entityCommit,
      })
  }

  onEntityDelete(params: EntityDeletedMessage) {
    const namespace = this.io.of(`/project|${params.projectId}`)
    if (params.isDefaultBranch) {
      namespace.emit(EntityEvents.ENTITY_DELETE, {
        entityId: params.entityId,
        branchId: params.branchId,
      })
      return
    }
    namespace.to(BroadcastHelper.getBranchRoomName(params.branchId))
      .emit(EntityEvents.ENTITY_DELETE, {
        entityId: params.entityId,
        branchId: params.branchId,
      })
  }

  onBranchDelete(message: BranchDeletedMessage) {
    const namespace = this.io.of(`/project|${message.projectId}`)
    namespace.emit(BranchEvents.DELETE, message.branchId)
  }

  onThreadCreated(message: ThreadCreatedMessage) {
    const namespace = this.io.of(`/project|${message.thread.project}`)
    namespace.to(BroadcastHelper.getBranchRoomName(message.thread.branch))
      .emit(CommentsEvents.THREAD_CREATE, {
        ...message.thread,
        comments: [message.comment],
        entity: undefined,
      })
  }
  onCommentCreated(message: CommentCreatedMessage) {
    const namespace = this.io.of(`/project|${message.thread.project}`)
    namespace.emit(CommentsEvents.THREAD_UPDATE, {
      ...message.thread,
      comments: [message.comment],
      entity: undefined,
    })
    namespace.to(BroadcastHelper.getThreadRoomName(message.thread._id))
      .emit(CommentsEvents.COMMENT_CREATE, message.comment)
  }
}
