import {
  NotFoundError,
  InternalError,
} from 'restify-errors'
import { ObjectId } from '@multiplayer/mongo'
import { EntityConverter } from '@multiplayer/entity'
import {
  EntityType,
  EntityCommitStorageType,
  ErrorMessage,
  IEntity,
} from '@multiplayer/types'
import { s3 } from '@multiplayer/s3'
import {
  EntityModel,
  IEntityDocument,
  ProjectBranchModel,
  IEntityCommitDocument,
} from '@multiplayer/models'
import * as ProjectBranchService from './project-branch.service'
import { InternalVersionService } from './version.internal.service'
import { EntityCache } from '../cache'
import { slugifyString } from '@multiplayer/util-shared'

const getEntitySnapshotFromS3 = async (entityCommit: IEntityCommitDocument) => {
  const { key, bucket } = entityCommit

  if (!key || !bucket) {
    throw new InternalError('Not enough records to find entity document')
  }
  return s3.downloadFileAsByteArray(key, bucket)
}

const getEntitySnapshot = (entityCommit: IEntityCommitDocument) => {
  if (entityCommit.storageType !== EntityCommitStorageType.S3) {
    throw new Error('Unable to load platform document')
  }

  return getEntitySnapshotFromS3(entityCommit)
}

export const getEntityInBranchById = async (
  workspaceId: ObjectId | string,
  projectId: ObjectId | string,
  entityId: ObjectId | string,
  projectBranchId: ObjectId | string,
  entityType?: EntityType,
): Promise<IEntityDocument> => {
  const entity = await EntityModel.getEntityInBranchByEntityId(
    entityId,
    projectBranchId,
    {
      workspace: workspaceId,
      project: projectId,
      ...entityType? { type: entityType } : {},
    },
  )

  if (!entity) {
    throw new NotFoundError(`Entity with id ${entityId} not found`)
  }

  return entity
}

// export const getEntityInBranchByName = async (
//   workspaceId: ObjectId | string,
//   projectId: ObjectId | string,
//   entityName: string,
//   projectBranchId: ObjectId | string,
//   entityType?: EntityType,
// ): Promise<IEntityDocument> => {
//   const entity = await EntityModel.getEntityInBranchByEntityId(
//     entityId,
//     projectBranchId,
//     {
//       workspace: workspaceId,
//       project: projectId,
//       ...entityType? { type: entityType } : {},
//     },
//   )

//   if (!entity) {
//     throw new NotFoundError(`Entity with id ${entityId} not found`)
//   }

//   return entity
// }


export const getComponentsByKeys = async (
  workspaceId: ObjectId | string,
  projectId: ObjectId | string,
  projectBranchId: ObjectId | string,
  keys: string[],
): Promise<IEntityDocument[]> => {
  const platformComponentEntities = await EntityModel.getEntitiesInBranchByKeys(
    keys,
    projectBranchId,
    {
      workspace: workspaceId,
      project: projectId,
      type: EntityType.PLATFORM_COMPONENT,
    },
  )

  return platformComponentEntities
}

export const getComponent = async (
  workspaceId: ObjectId | string,
  projectId: ObjectId | string,
  entityId: ObjectId | string,
  projectBranchId: ObjectId | string,
): Promise<IEntityDocument> => {
  const entity = await getEntityInBranchById(
    workspaceId,
    projectId,
    entityId,
    projectBranchId,
    EntityType.PLATFORM_COMPONENT,
  )

  return entity
}

export const getPlatform = async (
  workspaceId: ObjectId | string,
  projectId: ObjectId | string,
  entityId: ObjectId | string,
  projectBranchId: ObjectId | string,
): Promise<IEntityDocument> => {
  const entity = await getEntityInBranchById(
    workspaceId,
    projectId,
    entityId,
    projectBranchId,
    EntityType.PLATFORM,
  )

  return entity
}

export const upsertPlatformInDefaultProjectBranch = async (
  workspaceId: ObjectId | string,
  projectId: ObjectId | string,
  platformName: string,
): Promise<string> => {
  const existingPlatformId = await EntityCache.get(
    workspaceId.toString(),
    projectId.toString(),
    EntityType.PLATFORM,
    platformName,
  )

  if (existingPlatformId) {
    return existingPlatformId
  }

  const projectBranchId = await ProjectBranchService.getDefaultProjectBranchIdByProjectId(projectId.toString())

  const [existingPlatform] = await getEntitiesByKeys(
    workspaceId,
    projectId,
    [platformName],
    projectBranchId,
    EntityType.PLATFORM,
  )

  if (existingPlatform) {
    return existingPlatform.entityId.toString()
  }

  const versionService = new InternalVersionService()

  const { entity: newPlatform } = await versionService.createEntity({
    workspaceId: workspaceId.toString(),
    projectId: projectId.toString(),
    branchId: projectBranchId,
    payload: {
      key: platformName,
      type: EntityType.PLATFORM,
      archived: false,
    },
  })

  await EntityCache.set(
    workspaceId.toString(),
    projectId.toString(),
    EntityType.PLATFORM,
    newPlatform.entityId,
    platformName,
  )

  return newPlatform.entityId
}

export const getComponentsInPlatform = async (
  entityId: ObjectId | string,
  projectBranchId: ObjectId | string,
): Promise<IEntityDocument[]> => {
  const projectBranchTree = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
  const projectBranchState = await EntityModel.getProjectBranchState(
    projectBranchTree.map(({ _id }) => _id), { entityId },
  )
  if (!projectBranchState.data.length || !projectBranchState.data[0].entityCommit) {
    throw new NotFoundError(ErrorMessage.ENTITY_COMMIT_NOT_FOUND)
  }
  const entityCommit = projectBranchState.data[0].entityCommit

  if (!entityCommit) {
    throw new InternalError('Failed to load platform')
  }

  const platformContent = await getEntitySnapshot(entityCommit)

  if (!platformContent) {
    throw new InternalError('Failed to load platform')
  }

  const platform = EntityConverter.convertStateToData(EntityType.PLATFORM, platformContent)

  const componentEntityIds = Object.keys(platform.components)
    .map(id => platform.components[id].linkedTo)

  const entitiesComponents = await EntityModel.getEntitiesInBranchByEntityIds(
    componentEntityIds,
    projectBranchTree.map(({ _id }) => _id),
  )

  // const keyAliases = entitiesComponents
  //   .reduce((acc: string[][], entity) => ([
  //     ...acc,
  //     [
  //       entity.key,
  //       ...(entity.keyAliases || []),
  //     ],
  //   ]), [])

  return entitiesComponents
}

export const getEntitiesByKeys = async (
  workspaceId: ObjectId | string,
  projectId: ObjectId | string,
  keys: string[],
  projectBranchId: ObjectId | string,
  entityType: EntityType,
): Promise<IEntityDocument[]> => {
  const environments = await EntityModel.getEntitiesInBranchByKeys(
    keys.map((key) => slugifyString(key)),
    projectBranchId,
    {
      workspace: workspaceId,
      project: projectId,
      type: entityType,
    },
  )

  return environments
}

export const getEntityByKeyInDefaultProjectBranch = async (
  workspaceId: ObjectId | string,
  projectId: ObjectId | string,
  key: string,
  entityType: EntityType,
): Promise<IEntityDocument> => {
  const defaultProjectBranchId = await ProjectBranchService.getDefaultProjectBranchIdByProjectId(
    projectId.toString(),
  )

  return EntityModel.getEntityInBranchByKey(
    key,
    defaultProjectBranchId,
    {
      workspace: workspaceId,
      project: projectId,
      type: entityType,
    },
  )
}
