import { ObjectId } from '@multiplayer/mongo'
import {
  EntityCommitModel,
  EntityModel,
  EntityTypesWithUniqueAlias,
  IEntityCommitDocument,
  IEntityDocument,
  IProjectBranchDocument,
} from '@multiplayer/models'
import {
  EntityCommitStatus,
  EntityCommitChangeType,
  EntityCommitStorageType,
  ErrorMessage, EntityType, ErrorMessageWithParams,
} from '@multiplayer/types'
import { s3 } from '@multiplayer/s3'
import { S3_PRIVATE_BUCKET } from '../config'
import { InvalidArgumentError, NotFoundError } from 'restify-errors'
import { deleteProjectLink } from './project-link.lib'
import { getEntitiesWithAliases } from './entity.lib'
import { EntityCommitHelper } from '../helpers'

export const createEntityCommit = async (
  payload: Partial<IEntityCommitDocument>,
  entity: IEntityDocument,
): Promise<IEntityCommitDocument & { url?: string }> => {
  const entityCommitId = new ObjectId()
  const _entityCommitPayload: any = {
    ...payload,
    _id: entityCommitId,
    entityType: entity.type,
    entity: entity.entityId,
    status: [
      EntityCommitChangeType.DELETE,
      EntityCommitChangeType.ARCHIVE,
      EntityCommitChangeType.UNARCHIVE,
    ].includes(payload.changeType as EntityCommitChangeType) || payload.storageType === EntityCommitStorageType.GIT
      ? EntityCommitStatus.DONE
      : EntityCommitStatus.PENDING,
  }

  if (
    _entityCommitPayload.storageType === EntityCommitStorageType.S3
    && _entityCommitPayload.status !== EntityCommitStatus.DONE
  ) {
    _entityCommitPayload.key = EntityCommitHelper.getS3Key({
      workspaceId: _entityCommitPayload.workspace,
      projectId: _entityCommitPayload.project,
      entityId: entity.entityId.toString(),
      entityCommitId: _entityCommitPayload._id,
    })
    _entityCommitPayload.bucket = S3_PRIVATE_BUCKET
  }

  const entityCommit = await EntityCommitModel.createEntityCommit(_entityCommitPayload)

  const entityCommitObject: any = entityCommit.toJSON()

  if (
    _entityCommitPayload.storageType === EntityCommitStorageType.S3
    && entityCommit.status !== EntityCommitStatus.DONE
  ) {
    const presignedUrl = await s3.getPresignedUploadUrl(
      entityCommit.key as string,
      entityCommit?.bucket as string,
    )

    entityCommitObject.url = presignedUrl
  }

  return entityCommitObject
}

export const createEntityCommitWithEntityVersion = async (params: {
  entity: IEntityDocument | undefined
  entityId: string
  projectBranch: IProjectBranchDocument
  payload: {
    changeType: IEntityCommitDocument['changeType'],
    storageType?: IEntityCommitDocument['storageType'],
    meta?: IEntityCommitDocument['meta'],
  }
}): Promise<{
  entityCommit: IEntityCommitDocument,
  entity: IEntityDocument
}> => {
  const {
    entityId,
    projectBranch,
  } = params
  const entityCommitPayload: Partial<IEntityCommitDocument> = {
    ...params.payload,
    projectBranch: projectBranch._id,
  }
  let entity = params.entity
  if (!entity) {
    const entityFromParentProjectBranch = await EntityModel.getEntityInBranchByEntityId(
      entityId,
      projectBranch.parentProjectBranch,
    )

    if (!entityFromParentProjectBranch) {
      throw new NotFoundError(ErrorMessage.ENTITY_NOT_FOUND)
    }
    if (params.payload.changeType !== EntityCommitChangeType.DELETE) {
      const keys = [
        ...entityFromParentProjectBranch.keyAliases,
        entityCommitPayload.meta?.entityName || entityFromParentProjectBranch.key,
      ]
      const foundDuplicate = await getDuplicatesWithinBranch({
        keys,
        projectBranchId: projectBranch._id,
        entityId,
        type: entityFromParentProjectBranch.type,
      })
      if (foundDuplicate) {
        throw new InvalidArgumentError(ErrorMessageWithParams.NO_ALIAS_DUPLICATES(
          foundDuplicate.key,
          foundDuplicate.entity.key,
          foundDuplicate.entity.type,
        ))
      }
    }

    const { data: [parentBaseChange] } = await EntityCommitModel.getChangesInBranch(
      projectBranch.parentProjectBranch,
      {
        entity: entityId,
      },
    )

    entityCommitPayload.baseEntityCommit = parentBaseChange.entityCommit._id
    entityCommitPayload.parentEntityCommit = parentBaseChange.entityCommit._id

    entity = await EntityModel.createEntity({
      ...entityFromParentProjectBranch.toObject(),
      projectBranch: projectBranch._id,
      key: entityCommitPayload.meta?.entityName || entityFromParentProjectBranch.key,
      typeOfChangeInBranch: entityCommitPayload.changeType,
      metadata: entityCommitPayload.meta?.summary || entityFromParentProjectBranch.metadata,
    })
  } else {
    const { data: [parentEntityCommitChange] } = await EntityCommitModel.getChangesInBranch(
      projectBranch._id,
      {
        entity: entityId,
      },
    )

    entityCommitPayload.baseEntityCommit = parentEntityCommitChange?.entityCommit?.baseEntityCommit
    entityCommitPayload.parentEntityCommit = parentEntityCommitChange?.entityCommit?._id
  }

  if (!entityCommitPayload.meta) entityCommitPayload.meta = {}
  if (!entityCommitPayload.meta?.entityName) entityCommitPayload.meta.entityName = entity.key
  if (!entityCommitPayload.meta?.summary) {
    entityCommitPayload.meta.summary = entity.toJSON().metadata
  }

  entityCommitPayload.workspace = entity.workspace
  entityCommitPayload.project = entity.project

  const entityCommitObject = await createEntityCommit(
    entityCommitPayload,
    entity,
  )

  if (entityCommitPayload.changeType === EntityCommitChangeType.DELETE) {
    await deleteProjectLink(
      projectBranch._id,
      {
        targetObjectId: entityId,
      },
    )
    await deleteProjectLink(
      projectBranch._id,
      {
        sourceObjectId: entityId,
      },
    )
  }

  return {
    entityCommit: entityCommitObject,
    entity,
  }
}

export async function updateMeta(params: {
  entity?: IEntityDocument,
  entityId: string
  currentProjectBranch: IProjectBranchDocument,
  lastEntityCommit: IEntityCommitDocument,
  metaPayload: { entityName?: string, summary?: Record<string, string> }
}) {
  const {
    _id,
    createdAt,
    updatedAt,
    parentEntityCommit,
    projectBranch,
    commit,
    project,
    workspace,
    ...payload
  } = params.lastEntityCommit
  let entity = params.entity
  if (!entity) {
    const entityFromParentProjectBranch = await EntityModel.getEntityInBranchByEntityId(
      params.entityId,
      params.currentProjectBranch.parentProjectBranch,
    )

    if (!entityFromParentProjectBranch) {
      throw new InvalidArgumentError(ErrorMessage.INTERNAL_ERROR_NO_PARENT_ENTITY_STATE)
    }

    entity = await EntityModel.createEntity({
      ...entityFromParentProjectBranch.toObject(),
      projectBranch: params.currentProjectBranch._id,
      key: params.metaPayload.entityName || entityFromParentProjectBranch.key,
      typeOfChangeInBranch: EntityCommitChangeType.UPDATE,
      metadata: params.metaPayload.summary || entityFromParentProjectBranch.metadata,
    })

    payload.baseEntityCommit = params.lastEntityCommit._id

  } else {
    const updatedEntity = await EntityModel.updateEntityInBranch(
      params.entityId,
      params.currentProjectBranch._id,
      {
        key: params.metaPayload.entityName || entity.key,
        metadata: params.metaPayload.summary || entity.metadata,
      },
    )
    if (updatedEntity) {
      entity = updatedEntity
    }
  }

  const entityCommit = await EntityCommitModel.createEntityCommit({
    ...payload,
    name: undefined,
    workspace,
    project,
    changeType: EntityCommitChangeType.UPDATE,
    parentEntityCommit: params.lastEntityCommit._id,
    projectBranch: params.currentProjectBranch._id,
    meta: {
      entityName: params.metaPayload.entityName || entity.key,
      summary: params.metaPayload.summary || entity.metadata,
    },
  })

  return { entity, entityCommit }
}

// use this function to check if entity can be created within branch
export async function getDuplicatesWithinBranch(params: {
  keys: string[],
  projectBranchId: string | ObjectId,
  entityId?: string | ObjectId | undefined
  type: EntityType
}) {
  if (!EntityTypesWithUniqueAlias.includes(params.type)) {
    return undefined
  }
  const foundEntities = await getEntitiesWithAliases({
    projectBranchId: params.projectBranchId,
    keys: params.keys,
    entityType: params.type,
    entityIdToIgnore: params.entityId,
  })
  if (!foundEntities.length) {
    return undefined
  }
  const entityWithDuplicate = foundEntities[0]
  const entityKeys = [...(entityWithDuplicate.keyAliases || []), entityWithDuplicate.key]
  const dupKey = params.keys.find((key) => entityKeys.includes(key)) || ''
  return { key: dupKey, entity: entityWithDuplicate }
}
