import {
  BadRequestError,
  InternalServerError,
  InvalidArgumentError,
  NotFoundError,
} from 'restify-errors'
import { ObjectId } from '@multiplayer/mongo'
import {
  EntityCommitModel, EntityContentModel,
  EntityModel,
  ICommitDocument,
  IEntityCommitDocument,
  IEntityCommitWithEntityDocument,
  IEntityDocument,
  IProjectBranchDocument,
  IWorkspaceUserDocument,
  ProjectBranchModel,
} from '@multiplayer/models'
import {
  BulkAction,
  CommitType,
  EntityCommitChangeType,
  EntityCommitStatus,
  EntityCommitStorageType,
  EntityType,
  EntityUpdateRequest,
  ErrorMessage,
  ErrorMessageWithParams,
  ICommit,
  IEntityContent,
  IGitRef,
  ITag,
} from '@multiplayer/types'
import { EntityConverter } from '@multiplayer/entity'
import { s3 } from '@multiplayer/s3'
import { createEntityCommit, createEntityCommitWithEntityVersion, getDuplicatesWithinBranch } from './entity-commit.lib'
import * as CommitLib from './commit.lib'
import * as ProjectLinkLib from './project-link.lib'
import * as GitRefTagLib from './git-ref-tag.lib'
import * as AMQPLib from './amqp.lib'
import { fetch } from '@multiplayer/fetch'
import logger from '@multiplayer/logger'
import { slugifyString } from '@multiplayer/util-shared'
import { ExtensionUtil } from '../util'

export type BulkCreateEntity = {
  action?: BulkAction.CREATE,
  key: string,
  keyAliases?: string[]
  tags?: ITag[]
  type: EntityType,
  gitRef?: IGitRef,
  metadata?: Record<string, string>,
  metaSummary?: Record<string, string>,
  data?: object
  sourceUri?: string
}

type BulkDeleteEntity = {
  action: BulkAction.DELETE,
  entityId: string
}

export type UpdateEntity = {
  entityId: string
  key: string,
  keyAliases?: string[]
  tags?: ITag[]
  metadata?: Record<string, string>
  archived?: boolean,
  gitRefBranch?: string
}

export const createEntity = async (params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  type: EntityType,
  key: string,
  gitRef?: IGitRef,
  keyAliases?: string[],
  hostnames?: string[],
  tags?: ITag[]
  state: Uint8Array,
  sourceUri?: string,
  default?: boolean
}): Promise<{
  entity: IEntityDocument,
  entityCommit: IEntityCommitDocument,
}> =>{
  let entity: IEntityDocument | undefined
  let entityCommit: IEntityCommitDocument | undefined
  try {
    const {
      workspaceId,
      projectId,
      projectBranchId,
      key,
      gitRef,
      state,
      keyAliases,
      hostnames,
      type,
      tags,
      default: _default,
      sourceUri,
    } = params
    const summary = JSON.parse(JSON.stringify(EntityConverter.getSummaryFromState(type, state)))

    entity = await EntityModel.createEntity({
      entityId: new ObjectId(),
      workspace: workspaceId,
      project: projectId,
      projectBranch: projectBranchId,
      typeOfChangeInBranch: EntityCommitChangeType.CREATE,
      type,
      key,
      gitRef: ([EntityType.API, EntityType.FILE].includes(type)) ? gitRef : undefined,
      metadata: summary,
      keyAliases,
      hostnames,
      tags,
      sourceUri,
      default: _default,
    })

    entityCommit = await createEntityCommit(
      {
        workspace: new ObjectId(workspaceId),
        project: new ObjectId(projectId),
        projectBranch: new ObjectId(projectBranchId),
        changeType: EntityCommitChangeType.CREATE,
        storageType: entity.gitRef ? EntityCommitStorageType.GIT : EntityCommitStorageType.S3,
        meta: {
          entityName: key,
          summary,
        },
      },
      entity,
    )

    if (entityCommit.storageType === EntityCommitStorageType.S3) {
      if (!entityCommit?.key || !entityCommit?.bucket) {
        throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
      }

      await s3.uploadFile(
        entityCommit.key,
        entityCommit.bucket,
        state,
      )
    }

    const updatedEntityCommit = await EntityCommitModel.updateEntityCommitById(
      entityCommit._id,
      {
        status: EntityCommitStatus.DONE,
        baseEntityCommit: entityCommit._id,
      },
    )
    if (!updatedEntityCommit) {
      throw new InternalServerError('Entity commit not found')
    }

    await EntityContentModel.createEntityContent({
      workspace: new ObjectId(workspaceId),
      project: new ObjectId(projectId),
      projectBranch: new ObjectId(projectBranchId),
      type: entity.type,
      data: EntityConverter.convertStateToData(entity.type, state),
      entityId: entity.entityId,
    })

    return {
      entity,
      entityCommit: updatedEntityCommit,
    }
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (entity) {
      await EntityModel.deleteEntityInBranch(entity.entityId, params.projectBranchId)
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (entityCommit) {
      await EntityCommitModel.deleteEntityCommitById(entityCommit._id)
    }
    throw err
  }
}

// Shared by the entity-creation HTTP route and any other in-process caller -
// the route additionally supports importing state from an uploaded file, which
// only applies to the HTTP/multipart path and is handled by the caller
// before/instead of computing `state` here.
export const createEntityWithCommit = async (params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  type: EntityType,
  key: string,
  gitRef?: IGitRef,
  metadata?: Record<string, string>,
  keyAliases?: string[],
  hostnames?: string[],
  tags?: ITag[],
  sourceUri?: string,
  initialState?: any,
  // Only set by the HTTP route for the multipart file-import case - bypasses
  // the sourceUri/initialState/default-content computation below entirely.
  precomputedState?: Uint8Array,
  default?: boolean,
  projectBranch: IProjectBranchDocument,
  lastCommit: ICommitDocument,
  workspaceUser?: IWorkspaceUserDocument,
}): Promise<{
  entity: IEntityDocument,
  entityCommit: IEntityCommitDocument,
  commit: ICommit,
}> => {
  const {
    workspaceId,
    projectId,
    projectBranchId,
    type,
    gitRef,
    metadata = {},
    hostnames,
    tags,
    sourceUri,
    initialState,
    precomputedState,
    default: _default,
    projectBranch,
    lastCommit,
    workspaceUser,
  } = params

  const key = slugifyString(params.key)
  const keyAliases = params.keyAliases?.map(keyAlias => slugifyString(keyAlias)) || []

  let state = precomputedState ?? EntityConverter.getInitialContent(type, metadata, key)

  if (!precomputedState && sourceUri) {
    try {
      const resp = await fetch.get(sourceUri, { responseType: 'text' })
      const extension = ExtensionUtil.getExtension(sourceUri, resp.headers['content-type'])
      state = EntityConverter.convertSourceToState(type, key, resp.data, extension)
    } catch (err) {
      logger.error(err, 'Failed to fetch source')
      throw new BadRequestError('Provided source is inaccessible')
    }
  }

  if (!precomputedState && initialState) {
    state = EntityConverter.convertDataToState(type, initialState)
  }

  const { entity, entityCommit } = await createEntity({
    workspaceId,
    projectId,
    projectBranchId,
    type,
    key,
    gitRef,
    state,
    keyAliases,
    tags,
    hostnames,
    sourceUri,
    default: _default,
  })

  const commit = await CommitLib.createCommit({
    projectBranch,
    lastCommit,
    entityCommits: [entityCommit],
    projectBranchState: [],
    message: 'create',
    label: 'create',
    type: CommitType.AUTO,
    workspaceUsers: workspaceUser ? [workspaceUser._id.toString()] : [],
  })

  await AMQPLib.notifyOnEntityCreate({
    entity: entity.toJSON(),
    entityCommit: entityCommit.toJSON(),
    isDefaultBranch: !!projectBranch.default,
  })

  commit.entityCommits.forEach((ec: any) => {
    ec.entity = ec.entity.entityId
  })

  return { entity, entityCommit, commit }
}

export const bulkCreate = async (params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  entities: (BulkCreateEntity | BulkDeleteEntity)[],
  workspaceUser: IWorkspaceUserDocument,
  projectBranch: IProjectBranchDocument,
  lastCommit: ICommitDocument,
}): Promise<{
  added: {
    entity: IEntityDocument
    entityCommit: IEntityCommitDocument
  }[],
  deleted: {
    entity: IEntityDocument
    entityCommit: IEntityCommitDocument
  }[],
  commit: ICommit
}> => {
  const {
    workspaceId,
    projectId,
    projectBranchId,
    entities,
    workspaceUser,
    projectBranch,
    lastCommit,
  } = params
  if (!entities.length) {
    return {
      added: [],
      deleted: [],
      commit: lastCommit.toJSON(),
    }
  }

  const addedResults = await bulkCreateEntities({
    workspaceId,
    projectId,
    projectBranchId,
    entities: <BulkCreateEntity[]>entities.filter((e) => !e.action || e.action === BulkAction.CREATE),
  })
  const deletedResults = await bulkDeleteEntities({
    entityIds: (<BulkDeleteEntity[]>entities
      .filter((e) => e.action === BulkAction.DELETE))
      .map(({ entityId }) => entityId),
    projectBranch,
    workspaceId,
    projectId,
  })

  const commit = await CommitLib.createCommit({
    projectBranch,
    lastCommit,
    entityCommits: [
      ...deletedResults.map(({ entityCommit }) => entityCommit),
      ...addedResults.map(({ entityCommit }) => entityCommit),
    ],
    projectBranchState: [],
    message: 'Bulk',
    label: 'bulk',
    type: CommitType.AUTO,
    workspaceUsers: [workspaceUser._id.toString()],
  })

  return {
    added: addedResults,
    deleted: deletedResults,
    commit,
  }
}

export const bulkUpdate = async (
  projectBranchId: string,
  entities: UpdateEntity[],
): Promise<Awaited<{ entity: IEntityDocument; entityCommit?: IEntityCommitDocument, parentBaseChange?: IEntityCommitWithEntityDocument }>[]> => {
  if (!entities.length) {
    return []
  }

  const projectBranch = await ProjectBranchModel.findProjectBranchById(projectBranchId)

  if (!projectBranch) {
    throw new InternalServerError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND)
  }

  return Promise.all(entities.map(_entityPayload => updateEntity(
    _entityPayload.entityId,
    projectBranch,
    _entityPayload,
  )))
}

export const bulkCreateEntities = async (params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  entities: BulkCreateEntity[],
}) => {
  const {
    workspaceId,
    projectId,
    projectBranchId,
    entities,
  } = params
  if (!entities.length) {
    return []
  }

  return Promise.all(entities.map(async (payload) => {
    const { data, ..._payload } = payload
    let state = data
      ? EntityConverter.convertDataToState(_payload.type, {
        ...EntityConverter.getEmptyTemplateData(_payload.type, _payload.key, _payload.metadata || {}),
        ...data,
      })
      : EntityConverter.getInitialContent(_payload.type, _payload.metadata || {}, _payload.key)

    if (payload.sourceUri) {
      try {
        const resp = await fetch.get(payload.sourceUri, { responseType: 'text' })
        const extension = ExtensionUtil.getExtension(payload.sourceUri, resp.headers['content-type'])
        state = EntityConverter.convertSourceToState(payload.type, payload.key, resp.data, extension)
      } catch (err) {
        logger.error(err)
        throw new BadRequestError(`Provided source for ${ payload.key } is inaccessible`)
      }
    }
    return createEntity({
      workspaceId,
      projectId,
      projectBranchId,
      state,
      ..._payload,
    })
  }))
}

export const bulkDeleteEntities = async (params: {
  workspaceId: string,
  projectId: string,
  projectBranch: IProjectBranchDocument,
  entityIds?: string[],
  type?: EntityType,
  default?: boolean
}): Promise<{
  entityCommit: IEntityCommitDocument,
  entity: IEntityDocument
}[]> => {
  const {
    entityIds,
    projectBranch,
    workspaceId,
    projectId,
    type,
    default: _default,
  } = params

  if (!entityIds && !type) {
    throw new Error('Invalid filter arguments')
  }

  if (!entityIds?.length && !type) {
    return []
  }

  const _entityIds: string[] = []
  // filter for entities that belong to project
  for await (const entity of EntityModel.getEntitiesInProjectCursor(
    workspaceId,
    projectId,
    {
      projectBranch: projectBranch._id,
      deletedAtCommit: { $exists: false },
      typeOfChangeInBranch: {
        $ne: EntityCommitChangeType.DELETE,
      },
      ...type ? { type } : {},
      ...entityIds?.length
        ? { entityId: { $in: entityIds?.map(id => new ObjectId(id)) } }
        : {},
      ...typeof _default === 'boolean'
        ? { default: _default ? true : { $ne: true } }
        : {},
    },
  )) {
    _entityIds.push(entity.entityId.toString())
  }

  const results = await Promise.all(_entityIds.map((entityId) =>
    processSingleEntityDelete(
      entityId,
      projectBranch._id.toString(),
      projectBranch,
    ),
  ))

  return results.filter(bulkDeleteRes =>
    bulkDeleteRes
    && bulkDeleteRes?.entity
    && bulkDeleteRes.entityCommit,
  ) as any
}

const processSingleEntityDelete = async (
  entityId: string,
  projectBranchId: string,
  projectBranch: IProjectBranchDocument,
): Promise<{
  entityCommit: IEntityCommitDocument,
  entity: IEntityDocument
} | undefined> => {
  const entity = await EntityModel.getEntityInBranchByEntityId(entityId, projectBranchId)
  try {
    return deleteEntity({
      entity,
      entityId,
      projectBranch,
    })
  } catch (err) {
    if (err instanceof NotFoundError) {
      return undefined
    }
    throw err
  }
}

export const deleteEntity = async (params: {
  entity?: IEntityDocument,
  entityId: string,
  projectBranch: IProjectBranchDocument
}): Promise<{
  entityCommit: IEntityCommitDocument,
  entity: IEntityDocument
}> => {
  const deletionResult = await createEntityCommitWithEntityVersion({
    entity: params.entity,
    entityId: params.entityId,
    projectBranch: params.projectBranch,
    payload: {
      changeType: EntityCommitChangeType.DELETE,
    },
  })

  const entity = await EntityModel.updateEntityInBranch(
    deletionResult.entity.entityId,
    deletionResult.entity.projectBranch,
    {
      deletedAtCommit: deletionResult.entityCommit._id.toString(),
      typeOfChangeInBranch: EntityCommitChangeType.DELETE,
    },
  ) as IEntityDocument

  await Promise.all([
    ProjectLinkLib.deleteProjectLink(
      params.projectBranch._id,
      {
        sourceObjectId: params.entityId,
      },
    ),
    ProjectLinkLib.deleteProjectLink(
      params.projectBranch._id,
      {
        targetObjectId: params.entityId,
      },
    ),
    GitRefTagLib.deleteGitRefTag(
      params.projectBranch._id,
      {
        objectId: params.entityId,
      },
    ),
    EntityContentModel.deleteEntityContentByEntityIdAndBranchId(params.entityId, params.projectBranch._id),
  ])

  return {
    entityCommit: deletionResult.entityCommit,
    entity,
  }
}

export const updateEntity = async (
  entityId: string | ObjectId,
  projectBranch: IProjectBranchDocument,
  payload: EntityUpdateRequest,
): Promise<{
  entity: IEntityDocument,
  entityCommit?: IEntityCommitDocument,
  parentBaseChange?: IEntityCommitWithEntityDocument,
}> => {
  if (payload.gitRefBranch) {
    payload['gitRef.branch'] = payload.gitRefBranch
    delete payload.gitRefBranch
  }

  const updatedEntity = await EntityModel.updateEntityInBranch(
    entityId,
    projectBranch._id,
    payload,
  )
  if (updatedEntity) {
    return {
      entity: updatedEntity,
    }
  }

  const entityFromParentProjectBranch = await EntityModel.getEntityInBranchByEntityId(
    entityId,
    projectBranch.parentProjectBranch,
  )

  if (!entityFromParentProjectBranch) {
    throw new InternalServerError(ErrorMessage.ENTITY_NOT_FOUND)
  }

  const gitRef = entityFromParentProjectBranch.gitRef
  entityFromParentProjectBranch.toObject()
  if (gitRef && payload['gitRef.branch']) {
    gitRef.branch = payload['gitRef.branch']
    delete payload['gitRef.branch']
  }
  const keys = [
    ...(payload.keyAliases || entityFromParentProjectBranch.keyAliases),
    payload.key || entityFromParentProjectBranch.key]

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

  const newEntity = await EntityModel.createEntity({
    ...entityFromParentProjectBranch.toObject(),
    ...payload,
    projectBranch: projectBranch._id,
    typeOfChangeInBranch: EntityCommitChangeType.UPDATE,
    gitRef,
  })
  try {
    // new entity in branch requires entity commit
    const { data: [parentBaseChange] } = await EntityCommitModel.getChangesInBranch(
      projectBranch.parentProjectBranch,
      {
        entity: entityId,
      },
    )
    const entityCommit = await EntityCommitModel.createEntityCommit({
      workspace: newEntity.workspace,
      project: newEntity.project,
      projectBranch: newEntity.projectBranch,
      entity: newEntity.entityId,
      entityType: newEntity.type,
      baseEntityCommit: parentBaseChange.entityCommit._id,
      parentEntityCommit: parentBaseChange.entityCommit._id,
      changeType: EntityCommitChangeType.UPDATE,
      storageType: parentBaseChange.entityCommit.storageType,
      key: parentBaseChange.entityCommit.key,
      bucket: parentBaseChange.entityCommit.bucket,
      status: EntityCommitStatus.DONE,
      meta: {
        entityName: newEntity.key,
        summary: newEntity.metadata,
      },
    })

    return {
      entity: newEntity,
      entityCommit,
      parentBaseChange,
    }
  } catch (err) {
    await EntityModel.deleteEntityInBranch(newEntity.entityId, projectBranch._id)
    throw err
  }
}

export async function getEntitiesWithAliases(params: {
  projectBranchId: string | ObjectId,
  keys: string[],
  entityType: EntityType,
  entityIdToIgnore?: string | ObjectId | undefined,
}) {
  const projectBranchTree = await ProjectBranchModel.getProjectBranchTree(params.projectBranchId)
  const { data: foundEntities } = await EntityModel.getProjectBranchState(
    projectBranchTree.map(({ _id }) => _id),
    {
      key: params.keys,
      type: params.entityType,
    },
  )

  return (params.entityIdToIgnore
    ? foundEntities.filter(({ entity }) => (!entity.entityId.equals(params.entityIdToIgnore)))
    : foundEntities
  ).map(({ entity }) => entity)
}

export const getEntityContent = async (
  projectBranchId: string,
  entityId: string,
): Promise<IEntityContent> => {
  const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
  const branchIds = projectBranches.map(({ _id }) => _id)

  const entity = await EntityModel.getEntityInBranchByEntityId(entityId, branchIds)

  if (!entity || entity.deletedAtCommit) {
    throw new NotFoundError('Entity does not exist')
  }

  return EntityContentModel.getEntityContentByEntityIdAndBranchMap(entity.entityId, branchIds) as unknown as IEntityContent
}
