import { Socket } from 'socket.io'
import {
  CommitEntityParams, CopyEntityParams,
  CreateEntityParams, DeleteEntityParams,
  EntityCreateResponse,
  EntityEvents,
  EntityEventsMap,
  EntityServerEventsMap, GitCommitEntityParams,
  ResetEntityParams,
  WSCallback,
} from '@multiplayer/types'
import { Observable } from 'lib0/observable'
import { VersionController } from '../controllers/version-controller'
import { DefaultEventsMap } from 'socket.io'
import { ProjectSocketData } from '../interfaces/project-socket-data'
import { requestErrorHandlerWithCallback } from './error.callback.handler'
import { BroadcastHelper } from './broadcast.helper'
import { handleError, JoiValidator } from '@multiplayer/util'
import {
  commitEntitySchema, copyEntitySchema,
  createEntitySchema, deleteEntitySchema,
  gitCommitEntitySchema,
  resetEntitySchema,
} from '../validation/schemas'
import { VersionService } from '../services/version-service'

type EntityHandlerEmittedEvents = EntityEvents.ENTITY_COMMIT |
EntityEvents.ENTITY_RESET |
EntityEvents.ENTITY_GIT_COMMIT

export class EntityHandler extends Observable<EntityHandlerEmittedEvents> {
  private socket: Socket<EntityEventsMap, EntityServerEventsMap, DefaultEventsMap, ProjectSocketData>
  private readonly controller: VersionController

  constructor(socket: Socket<EntityEventsMap, EntityServerEventsMap, DefaultEventsMap, ProjectSocketData>) {
    super()
    this.socket = socket
    this.controller = new VersionController(socket.data.workspaceId, socket.data.projectId)
  }

  setListeners() {
    this.socket.on(EntityEvents.ENTITY_CREATE, this.onEntityCreate.bind(this))
    this.socket.on(EntityEvents.ENTITY_DELETE, this.onEntityDelete.bind(this))
    this.socket.on(EntityEvents.ENTITY_COMMIT, this.onEntityCommit.bind(this))
    this.socket.on(EntityEvents.ENTITY_GIT_COMMIT, this.onEntityGitCommit.bind(this))
    this.socket.on(EntityEvents.ENTITY_RESET, this.onEntityReset.bind(this))
    this.socket.on(EntityEvents.ENTITY_COPY, this.onEntityCopy.bind(this))
  }

  @handleError(requestErrorHandlerWithCallback)
  @JoiValidator.validateParams(resetEntitySchema)
  async onEntityReset(params: ResetEntityParams, callback?: WSCallback<void>) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    if (!this.socket.data.user) {
      callback?.({ error: { status: 403, message: 'Action requires authorized access' } })
      return
    }
    const entityCommit = await this.controller.resetEntity(params, this.socket.data.user._id.toString())
    callback?.({ data: undefined })
    this.broadcastMessage(EntityEvents.ENTITY_UPDATE, params.branchId, params.entityId, entityCommit.meta)
    this.emit(EntityEvents.ENTITY_RESET, [params.entityId, params.branchId])
  }

  @handleError(requestErrorHandlerWithCallback)
  @JoiValidator.validateParams(copyEntitySchema)
  async onEntityCopy(params: CopyEntityParams, callback?: WSCallback<Omit<EntityCreateResponse, 'commit'>>) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    if (!this.socket.data.user) {
      callback?.({ error: { status: 403, message: 'Action requires authorized access' } })
      return
    }
    const { entity, entityCommit } = await this.controller.copyEntity(params, this.socket.data.user._id.toString())
    callback?.({ data: { entity, entityCommit } })
    this.broadcastMessage(EntityEvents.ENTITY_CREATE, params.branchId, { entity, entityCommit })
  }

  @handleError(requestErrorHandlerWithCallback)
  @JoiValidator.validateParams(createEntitySchema)
  async onEntityCreate(params: CreateEntityParams, callback?: WSCallback<Omit<EntityCreateResponse, 'commit'>>) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }

    const versionService = new VersionService(this.socket.handshake.headers.cookie)
    const entityCreateResponse = await versionService.createEntity({
      workspaceId: this.socket.data.workspaceId,
      projectId: this.socket.data.projectId,
      branchId: params.branchId,
      payload: {
        type: params.type,
        key: params.key,
        gitRef: params.gitRef,
        metadata: params.metaSummary,
        tags: params.tags || [],
      },
    })
    callback?.({ data: entityCreateResponse })
  }

  @handleError(requestErrorHandlerWithCallback)
  @JoiValidator.validateParams(commitEntitySchema)
  async onEntityCommit(params: CommitEntityParams, callback?: WSCallback<void>) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    this.emit(EntityEvents.ENTITY_COMMIT, [{ ...params, projectId: this.socket.data.projectId }, callback])
  }

  @handleError(requestErrorHandlerWithCallback)
  @JoiValidator.validateParams(gitCommitEntitySchema)
  async onEntityGitCommit(params: GitCommitEntityParams, callback?: WSCallback<void>) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    if (!this.socket.data.user) {
      callback?.({ error: { status: 403, message: 'Action requires authorized access' } })
      return
    }
    await this.controller.commitEntitiesToGit({
      entityIds: params.entityIds,
      branchId: params.branchId,
      commitMessage: params.commitMessage || 'Multiplayer Commit',
      workspaceUser: this.socket.data.user._id,
    })
    callback?.({ data: undefined })
  }

  @handleError(requestErrorHandlerWithCallback)
  @JoiValidator.validateParams(deleteEntitySchema)
  async onEntityDelete(params: DeleteEntityParams, callback?: WSCallback<void>) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    const versionService = new VersionService(this.socket.handshake.headers.cookie)
    const response = versionService.deleteEntity({
      workspaceId: this.socket.data.workspaceId,
      projectId: this.socket.data.projectId,
      branchId: params.branchId,
      entityId: params.entityId,
    })
    callback?.({ data: undefined })
  }

  private broadcastMessage(event, branchId, ...params) {
    const broadcast = (branchId === this.socket.data.defaultBranchId) ?
      this.socket.broadcast :
      BroadcastHelper.getBranchBroadcast(this.socket, branchId)

    broadcast.emit(event, ...params)
  }
}
