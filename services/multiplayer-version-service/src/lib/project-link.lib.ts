import { NotFoundError } from 'restify-errors'
import { ObjectId } from '@multiplayer/mongo'
import {
  ProjectBranchModel,
  CommitModel,
  ICommitDocument,
  ProjectLinkModel,
  IProjectLinkDocument,
  EntityModel,
  ISortOptions,
} from '@multiplayer/models'
import {
  ICursor,
  IProjectLink,
  DataWithCursor,
  ProjectBranchStatus,
  IntegrationTypeEnum,
  ProjectLinkObjectType,
  ErrorMessage,
  EntityType,
} from '@multiplayer/types'
import * as CommitLib from './commit.lib'
import { MongoPayload } from '@multiplayer/util'

export const getProjectLinkState = async (
  projectBranchId,
  filter?: Partial<Omit<IProjectLink, 'targetObjectType' | 'sourceObjectType' | 'targetEntityType' | 'sourceEntityType'>> & {
    archived?: boolean
    sourceGitRefRepositoryId?: string
    sourceGitRefBranch?: string
    sourceGitRefPath?: string
    sourceGitRefType?: IntegrationTypeEnum
    targetObjectType?: ProjectLinkObjectType | ProjectLinkObjectType[]
    sourceObjectType?: ProjectLinkObjectType | ProjectLinkObjectType[]
    targetObjectId?: string
    sourceObjectId?: string
    targetEntityType?: EntityType | EntityType[]
    sourceEntityType?: EntityType | EntityType[]
  },
  cursor?: ICursor,
  sort?: ISortOptions,
): Promise<DataWithCursor<IProjectLinkDocument>> => {
  const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)

  if (!projectBranches.length) {
    throw new NotFoundError('Project-Branch not found')
  }

  let mergeCommit: ICommitDocument | boolean = false

  if (projectBranches[0].status === ProjectBranchStatus.MERGED) {
    mergeCommit = await CommitModel.getMergeCommit(
      projectBranches[1]._id,
      projectBranches[0]._id,
    )
  }

  const projectLinksState = await ProjectLinkModel.getProjectLinkState(
    projectBranches.map(({ _id }) => _id),
    filter || {},
    cursor,
    mergeCommit ? mergeCommit._id : undefined,
    sort,
  )

  return projectLinksState
}

export const deleteProjectLink = async (
  projectBranchId: string | ObjectId,
  filter: {
    projectLinkId?: string,
    sourceGitRefRepositoryId?: string
    targetObjectId?: string | string[] | ObjectId | ObjectId[]
    sourceObjectId?: string | string[] | ObjectId | ObjectId[]
  },
) => {
  const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)

  if (!projectBranches.length) {
    throw new NotFoundError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND)
  }

  const { data: projectLinks } = await ProjectLinkModel.getProjectLinkState(
    projectBranches.map(({ _id }) => _id),
    MongoPayload.removeUndefinedProps({
      projectLinkId: filter.projectLinkId,
      sourceObjectId: filter.sourceObjectId,
      targetObjectId: filter.targetObjectId,
      sourceGitRefRepositoryId: filter.sourceGitRefRepositoryId,
    }),
  )

  if (!projectLinks.length) {
    return
  }

  const lastCommit = await CommitLib.getLastCommit(projectBranchId)
  if (!lastCommit) {
    throw new NotFoundError(`lastCommit was not found for branch ${projectBranchId}!`)
  }

  await Promise.all(projectLinks.map((projectLink) => {
    if ((projectLink.projectBranch as ObjectId).equals(projectBranchId)) {
      return ProjectLinkModel.updateProjectLinkById(
        projectLink.projectLinkId,
        projectBranchId,
        {
          deletedAtCommit: lastCommit._id.toString(),
        },
      )
    }

    const {
      _id,
      sourceObject,
      targetObject,
      ...payload
    } = projectLink

    return ProjectLinkModel.createProjectLink({
      ...payload,
      sourceObject: sourceObject.entityId || sourceObject._id || sourceObject,
      targetObject: targetObject.entityId || targetObject._id || targetObject,
      projectBranch: projectBranchId.toString(),
      deletedAtCommit: lastCommit._id.toString(),
    })
  }))
}

export const createProjectLink = async (params: {
  projectBranchId: string,
  workspaceId: string,
  projectId: string,
  payload: Partial<IProjectLink>,
  lastCommitId: string,
}) => {
  const {
    projectBranchId,
    workspaceId,
    projectId,
    lastCommitId,
  } = params

  const _payload = params.payload
  const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
  if (params.payload.sourceObjectType === ProjectLinkObjectType.Entity) {
    const sourceEntity = await EntityModel.getEntityInBranchByEntityId(
      _payload.sourceObject as string,
      projectBranches.map(({ _id }) => _id),
    )
    if (!sourceEntity) {
      throw new NotFoundError(ErrorMessage.SOURCE_ENTITY_NOT_FOUND)
    }
    _payload.sourceEntityType = sourceEntity.type
  }

  if (params.payload.targetObjectType === ProjectLinkObjectType.Entity) {
    const targetEntity = await EntityModel.getEntityInBranchByEntityId(
      _payload.targetObject as string,
      projectBranches.map(({ _id }) => _id),
    )
    if (!targetEntity) {
      throw new NotFoundError('Target entity not found')
    }
    _payload.targetEntityType = targetEntity.type
  }

  let projectLink = await ProjectLinkModel.createProjectLink({
    ..._payload,
    deletedAtCommit: null,
    projectBranch: projectBranchId,
    createdAtCommit: lastCommitId,
    workspace: workspaceId,
    project: projectId,
  })

  projectLink = await ProjectLinkModel.findProjectLinkById(
    projectLink.projectLinkId,
    [projectBranchId],
  ) as IProjectLinkDocument

  return projectLink
}

export const mergeProjectLinks = async (
  fromBranchId: string | ObjectId,
  toBranchId: string | ObjectId,
): Promise<void> => {
  const updatedProjectLinks = await ProjectLinkModel.findProjectLinks({
    projectBranch: fromBranchId as string,
    deletedAtCommit: null,
  })

  await ProjectLinkModel.deleteProjectLinksByIds(
    updatedProjectLinks.data.map(({ projectLinkId }) => projectLinkId),
    toBranchId,
  )

  await Promise.all(updatedProjectLinks.data.map(updatedProjectLink => {
    const { _id, ..._updatedProjectLink } = updatedProjectLink

    return ProjectLinkModel.createProjectLink({
      ..._updatedProjectLink,
      projectBranch: toBranchId as string,
    })
  }))

  const projectLinksToDelete = await ProjectLinkModel.findDeletedLinks(fromBranchId)
  const projectLinkIds = projectLinksToDelete.map((item) => item.projectLinkId)

  await ProjectLinkModel.deleteManyLinks({
    $or: [{
      projectLinkId: {
        $in: projectLinkIds,
      },
      projectBranch: toBranchId,
    }, {
      projectBranch: fromBranchId,
    }],
  })
}
