import { NotFoundError } from 'restify-errors'
import { Types } from 'mongoose'
import {
  ProjectBranchModel,
  CommitModel,
  ICommitDocument,
  EntityModel,
  IPopulatedEntityStateDocument,
  ISortOptions,
} from '@multiplayer/models'
import {
  ICursor,
  EntityType,
  DataWithCursor,
  ProjectBranchStatus,
  ErrorMessage,
  ITag,
} from '@multiplayer/types'

export const getProjectBranchState = async (
  projectBranchId,
  filter?: {
    commitId?: string,
    archived?: boolean,
    type?: EntityType,
    key?: string | string[],
    entityId?: string | string[],
    hasUncommittedSource?: boolean,
    tags?: ITag[]
    default?: boolean
  },
  cursor?: ICursor,
  sort?: ISortOptions,
): Promise<DataWithCursor<IPopulatedEntityStateDocument>> => {
  const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)

  if (!projectBranches.length) {
    throw new NotFoundError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND)
  }
  let mergeCommit: ICommitDocument | boolean = false

  if (projectBranches[0].status === ProjectBranchStatus.MERGED && projectBranches.length > 1) {
    mergeCommit = await CommitModel.getMergeCommit(
      projectBranches[1]._id,
      projectBranches[0]._id,
    )
  }

  const projectBranchState = await EntityModel.getProjectBranchState(
    projectBranches.map(({ _id }) => _id),
    filter,
    cursor,
    mergeCommit ? mergeCommit._id : undefined,
    sort,
  )

  return projectBranchState
}
export const getLatestEntityState = async (projectBranch: string, entityId: string) => {
  const branchState = await getProjectBranchState(
    projectBranch,
    { entityId },
  )
  if (!branchState.data.length) {
    return undefined
  }
  return branchState.data[0]
}

export const getBranchById = async (
  projectBranchId: string | Types.ObjectId,
) => {
  const projectBranch = await ProjectBranchModel.findProjectBranchById(projectBranchId)

  if (!projectBranch) {
    throw new NotFoundError('PROJECT_BRANCH_NOT_FOUND')
  }

  return projectBranch
}

export const getDefaultBranch = async (
  projectId: string | Types.ObjectId,
) => {
  const projectBranch = await ProjectBranchModel.getDefaultProjectBranch(projectId)

  if (!projectBranch) {
    throw new NotFoundError(ErrorMessage.DEFAULT_BRANCH_MISSED)
  }

  return projectBranch
}
