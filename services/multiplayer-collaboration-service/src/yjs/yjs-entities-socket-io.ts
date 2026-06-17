import { Socket } from 'socket.io'
import {
  fetchBranch,
  fetchEntity,
  fetchProject,
  fetchWorkspaceUser,
  socketCheckPermissions,
} from '../middlewares/auth'
import { DefaultEventsMap } from 'socket.io'
import {
  RoleAccessAction,
  EntityUpdatedMessage,
  GetEntityStateRequest,
  RoleProjectPermissionEntity,
  UpdateEntityStateRequest,
  YjsEvents,
  YjsEventsMap,
  YjsServerEventsMap,
  YjsUpdateStatus,
} from '@multiplayer/types'
import logger, { asyncLogError, logError } from '@multiplayer/logger'
import { EntityConverter } from '@multiplayer/entity'
import * as Y from 'yjs'
import {
  EntityUpdateModel,
  ProjectBranchModel,
} from '@multiplayer/models'
import { YjsEntitySocketData } from '../interfaces/yjs-socket-data'
import { EmittedEvents, YSocketIO } from './y-socket-io'
import { prometheusClient } from '../prometheus'
import { VersionController } from '../controllers/version-controller'
import { kafkaProducer } from '../kafka'
import { ENTITY_UPDATES_TOPIC } from '../config'
import { socketAuthorize, socketCookieParser, socketExpressSession } from '@multiplayer/auth'

type YjsEntitiesSocket = Socket<YjsEventsMap, YjsServerEventsMap, DefaultEventsMap, YjsEntitySocketData>

export class YjsEntitiesSocketIO extends YSocketIO<YjsEntitySocketData> {
  @asyncLogError
  protected async storeUpdate(data: Omit<YjsEntitySocketData, 'user' | 'isDefaultBranch' | 'allowEdit'>, update: number[]) {
    if (!update.length) return

    await EntityUpdateModel.createEntityUpdate({
      workspace: data.workspaceId,
      project: data.projectId,
      projectBranch: data.branchId,
      entityId: data.entityId,
      owner: data.userId,
      update: Buffer.from(new Uint8Array(update)),
    })
    await this.notifyAboutAvailableUpdates({
      workspace: data.workspaceId,
      project: data.projectId,
      projectBranch: data.branchId,
      entityId: data.entityId,
    })
  }

  private async notifyAboutAvailableUpdates(data: {
    workspace: string,
    project: string,
    projectBranch: string,
    entityId: string,
  }) {
    try {
      await kafkaProducer.send(ENTITY_UPDATES_TOPIC, data)
    } catch (err) {
      logger.error('Cannot send message to kafka', err)
    }
  }

  @asyncLogError
  protected async getNonCommittedUpdates(data: Omit<YjsEntitySocketData, 'user' | 'isDefaultBranch' | 'userId' | 'allowEdit'>) {
    let updates = await EntityUpdateModel.listEntityUpdates({
      workspace: data.workspaceId,
      project: data.projectId,
      projectBranch: data.branchId,
      entityId: data.entityId,
    }, {})
    if (!updates.data.length) {
      const controller = new VersionController(data.workspaceId, data.projectId)
      const entityState = await controller.getLatestState(data.branchId, data.entityId)
      if (entityState.entity.projectBranch === data.branchId) {
        return []
      }

      // check for parent updates
      updates = await EntityUpdateModel.listEntityUpdates({
        workspace: data.workspaceId,
        project: data.projectId,
        projectBranch: entityState.entity.projectBranch,
        entityId: data.entityId,
      }, {})
    }

    return updates.data
  }

  @logError
  public initialize (): void {
    // yjs|projectId/branchId/entityId
    const dynamicNamespace = this.io.of(/^\/yjs\|([A-Fa-f0-9]{24})\/([A-Fa-f0-9]{24})\/([A-Fa-f0-9]{24})$/)

    dynamicNamespace.use(socketCookieParser)
    dynamicNamespace.use(socketExpressSession)
    dynamicNamespace.use(fetchProject)
    dynamicNamespace.use(fetchBranch)
    dynamicNamespace.use(fetchEntity)
    dynamicNamespace.use((socket, next) => socketAuthorize({
      entity: RoleProjectPermissionEntity.ENTITY,
      action: RoleAccessAction.READ,
    }, {
      workspaceId: socket.data.workspaceId,
      projectId: socket.data.projectId,
      branchId: socket.data.branchId,
      entityId: socket.data.entityId,
    })(socket, next))
    dynamicNamespace.use(fetchWorkspaceUser)
    dynamicNamespace.use((socket, next) => {
      socketCheckPermissions({
        entity: RoleProjectPermissionEntity.ENTITY,
        action: RoleAccessAction.UPDATE,
      })(socket, (err: any) => {
        if (!err) {
          socket.data.allowEdit = true
        }

        return next()
      })
    })

    dynamicNamespace.on('connection', this.onNamespaceConnect.bind(this))
  }

  @asyncLogError
  private async generateUpdateForUpload(data: YjsEntitySocketData) {
    const entityUpdate = await EntityUpdateModel.createEntityUpdate({
      workspace: data.workspaceId,
      project: data.projectId,
      projectBranch: data.branchId,
      entityId: data.entityId,
      owner: data.userId,
      status: YjsUpdateStatus.IN_PROGRESS,
    })

    return entityUpdate._id.toString()
  }

  @asyncLogError
  protected async onNamespaceConnect(socket: YjsEntitiesSocket) {
    await super.onNamespaceConnect(socket)
    socket.on(YjsEvents.SYNC_UPDATE_URL, async (callback: (id: string) => void) => {
      if (!callback) return
      const id = await this.generateUpdateForUpload(socket.data)
      callback(id)
    })

    socket.on(YjsEvents.SYNC_UPDATE_URL_DONE, async (id: string) => {
      if (!id) return
      socket.broadcast.emit(YjsEvents.SYNC_UPDATE_URL_DONE, [id])
    })

    socket.once('disconnect', () => {
      prometheusClient.decUsersInDocNumber(socket.data.branchId, socket.data.entityId)
      if (socket.data.user) {
        this.emit(EmittedEvents.userDisconnected, [{
          userId: socket.data.userId,
          entityId: socket.data.entityId,
          branchId: socket.data.branchId,
          projectId: socket.data.projectId,
        }])
      }
    })
    prometheusClient.incUsersInDocNumber(socket.data.branchId, socket.data.entityId)
    if (socket.data.user) {
      this.emit(EmittedEvents.userConnected, [{
        user: socket.data.user,
        entityId: socket.data.entityId,
        branchId: socket.data.branchId,
        projectId: socket.data.projectId,
      }])
    }
  }

  @logError
  public destroyEntity(params: {
    projectId: string,
    entityId: string,
    branchId: string
  }) {
    const key = this.generateKey(params.projectId, params.branchId, params.entityId, '/')
    this.io.of(`yjs|${key}`).emit(YjsEvents.DESTROY_DOC)
  }

  @logError
  protected modifyUserAwareness(state: Record<string, unknown>, socket: YjsEntitiesSocket) {
    const updatedState = super.modifyUserAwareness(state, socket)
    if (updatedState) {
      updatedState.entityId = socket.data.entityId
    }
    return updatedState
  }

  @asyncLogError
  async refreshDependentDocs(entityId: string, branchId: string, projectId: string) {
    const branches = await ProjectBranchModel.findDependentProjectBranchesWithUnchangedEntity(branchId, entityId)
    branches.map(({ _id }) => {
      this.destroyEntity({ projectId, entityId, branchId: _id.toString() })
    })
  }

  @asyncLogError
  async getEntityState(request: GetEntityStateRequest) {
    //Todo: can be used directly in radar
    const controller = new VersionController(request.workspaceId, request.projectId)
    const latestState = await controller.getLatestState(request.branchId, request.entityId)
    const state = await controller.getEntitySnapshot(latestState.entityCommit, latestState.entity)
    if (!state) {
      return EntityConverter.getInitialContent(latestState.entity.type, latestState.entity.metadata, latestState.entity.key)
    }
    const updates = await this.getNonCommittedUpdates(request)
    const update = updates ?
      Y.mergeUpdates(updates
        .filter(({ update }) => update)
        .map(({ update }) => new Uint8Array((update as Buffer).buffer))) :
      undefined
    return update ? Y.mergeUpdates([state, update]): state
  }

  public generateKey(projectId: string, branchId: string, entityId: string, separator = '.') {
    return `${projectId}${separator}${branchId}${separator}${entityId}`
  }

  @asyncLogError
  async updateEntityStateAndCommit(message: UpdateEntityStateRequest) {
    const key = this.generateKey(
      message.projectId,
      message.branchId,
      message.entityId,
      '/',
    )

    await this.storeUpdate({
      projectId: message.projectId,
      branchId: message.branchId,
      entityId: message.entityId,
      userId: message.workspaceUserId,
      workspaceId: message.workspaceId,
    }, Array.from(message.state))

    const namespace = this.io.of(`/yjs|${key}`)
    namespace.emit(YjsEvents.SYNC_UPDATE, new Uint8Array(message.state))
  }

  onEntityUpdate(params: EntityUpdatedMessage) {
    const key = this.generateKey(
      params.entity.project,
      params.entity.projectBranch,
      params.entity.entityId,
      '/',
    )
    const namespace = this.io.of(`/yjs|${key}`)
    namespace.emit(YjsEvents.META_REFRESH, params.entity, new Date(params.entityUpdatedAt).getTime())
  }
}
