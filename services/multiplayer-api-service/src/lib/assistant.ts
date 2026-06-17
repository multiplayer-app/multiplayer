import {
  EntityCommitModel, IEntityCommitDocument, IEntityDocument, IPopulatedEntityStateDocument,
} from '@multiplayer/models'
import {
  ComponentType,
  DataWithCursor,
  EntityCommitStorageType,
  EntityType, Platform,
} from '@multiplayer/types'
import { EntityConverter } from '@multiplayer/entity'
import { s3 } from '@multiplayer/s3'
import { S3_PRIVATE_BUCKET } from '../config'
import { InternalError } from 'restify-errors'
import { Opensearch } from '../lib'
import chunk from 'lodash.chunk'
import { multiplayerInternalGitService, multiplayerInternalVersionService } from '../services'
import { ObjectId } from '@multiplayer/mongo'

export interface DeleteEntityVectorsMessage {
  workspaceId: string
  projectId?: string
  branchId?: string
  entityId?: string
}

export interface CreateEntityVectorMessage {
  workspaceId: string
  projectId: string
  branchId: string
  entityId: string
  entityCommit?: string
}

export class AssistantController {

  static async deleteVectorData(data: DeleteEntityVectorsMessage) {
    await Opensearch.EntityIndex.deleteDocuments(data)
  }


  static async createVectorData(data: CreateEntityVectorMessage, override = false) {
    const state = await multiplayerInternalVersionService.getProjectBranchState({
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      projectBranchId: data.branchId,
      entityId: data.entityId,
    })
    if (!state.data.length || !state.data[0].entityCommit) {
      return
    }

    const entity = state.data[0].entity
    let entityCommit: IEntityCommitDocument = state.data[0].entityCommit

    if (data.entityCommit) {
      const found = await EntityCommitModel.findEntityCommitById(data.entityCommit)
      if (!found || !found.project.equals(data.projectId)) return
      entityCommit = found
    }

    await AssistantController.deleteVectorData({
      entityId: entity.entityId.toString(),
      workspaceId: entity.workspace.toString(),
      projectId: entity.project.toString(),
      branchId: entity.projectBranch.toString(), // todo: distinguish between named and latest versions
    })
    let entityData: any

    if (entityCommit.storageType === EntityCommitStorageType.S3) {
      const snapshot = await AssistantController.getEntitySnapshot(entityCommit) || EntityConverter.getInitialContent(entity.type)
      if (!snapshot) return
      entityData = EntityConverter.convertStateToData(
        entity.type,
        EntityConverter.applyStateMigration(entity.type, snapshot),
      )
    } else if (entityCommit.storageType === EntityCommitStorageType.GIT && entity.gitRef) {
      const extension = entity.gitRef.path ? entity.gitRef.path.split('.').pop()?.toLowerCase() : 'txt'
      const contents = await multiplayerInternalGitService.getContents(entity.gitRef, entity.project.toString(), entity.workspace.toString())
      if (!contents) return
      entityData = EntityConverter.convertSourceToData(entity.type, entity.key, contents, extension)
    }
    if (!entityData) return
    const populatedData = await AssistantController.populateEntityData({
      data: entityData,
      entityType: entity.type,
      projectBranchId: entity.projectBranch.toString(),
      projectId: entity.project.toString(),
      workspaceId: entity.workspace.toString(),
    })
    const chunks = await EntityConverter.convertDataToChunks(entity.type, populatedData)

    await Promise.all(chunks.map(async (chunk, index) => {
      return Opensearch.EntityIndex.insertDocument({
        entityId: entity.entityId.toString(),
        entityType: entity.type,
        workspaceId: entity.workspace.toString(),
        branchId: entity.projectBranch.toString(),
        projectId: entity.project.toString(),
        tags: [],
        chunkIndex: 1,
        content: chunk.chunk,
        keywords: chunk.keywords,
        entityName: entity.key,
        metadata: entity.metadata || {},
      })
    }))

    await s3.uploadFile(
      AssistantController.getEntityFileKey(entity),
      S3_PRIVATE_BUCKET,
      EntityConverter.stringifyData(entity.type, populatedData))
  }

  public static getEntityFileKey(entity: {
    workspace: string | ObjectId,
    project: string| ObjectId,
    projectBranch: string| ObjectId,
    entityId: string| ObjectId,
  }) {
    return `workspaces/${entity.workspace}/${entity.project}/${entity.projectBranch}/${entity.entityId}`
  }

  private static async populateEntityData(params: {
    workspaceId: string,
    projectId: string,
    projectBranchId: string,
    data: any,
    entityType: EntityType
  }) {
    if (params.entityType !== EntityType.PLATFORM) {
      return params.data
    }
    const platform = params.data as Platform
    const componentIds = Object.values(platform.components || {})
      .reduce((acc, { linkedTo, id }) => {
        if (!linkedTo) return acc
        if (!acc[linkedTo]) acc[linkedTo] = []
        acc[linkedTo].push(id)
        return acc
      }, {})

    const chunkSize = 100
    const chunks = chunk(Object.keys(componentIds), chunkSize)
    if (!chunks.length) return platform

    const states: DataWithCursor<IPopulatedEntityStateDocument>[] = await Promise.all(
      chunks.map((ids) => multiplayerInternalVersionService.getProjectBranchState({
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        projectBranchId: params.projectBranchId,
        skip: 0,
        limit: ids.length,
        entityId: ids,
      })),
    )

    states.forEach((state) => {
      state.data.forEach((entityState) => {
        const entityId = entityState.entity.entityId
        componentIds[entityId.toString()].forEach((componentId: string) => {
          platform.components[componentId].name = entityState.entity.key
          platform.components[componentId].type = (entityState.entity.metadata?.type || ComponentType.GENERIC) as ComponentType
        })
      })
    })
    return platform
  }

  private static async getEntitySnapshot(entityCommit: IEntityCommitDocument) {
    const { key, bucket } = entityCommit

    if (!key || !bucket) {
      throw new InternalError('Not enough records to find entity document')
    }
    return s3.downloadFileAsByteArray(key, bucket)
  }
}
