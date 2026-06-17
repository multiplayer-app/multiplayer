import { NotFoundError } from 'restify-errors'
import {
  ProjectBranchModel,
  CommitModel,
  ICommitDocument,
  IEnvironmentDocument,
  EnvironmentModel,
  ISortOptions,
} from '@multiplayer/models'
import {
  ICursor,
  IEnvironment,
  DataWithCursor,
  ProjectBranchStatus,
} from '@multiplayer/types'

export const getEnvironmentState = async (
  projectBranchId,
  filter?: Partial<IEnvironment> & {
    archived?: boolean
  },
  cursor?: ICursor,
  sort?: ISortOptions,
): Promise<DataWithCursor<IEnvironmentDocument>> => {
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

  const environmentsState = await EnvironmentModel.getEnvironmentState(
    projectBranches.map(({ _id }) => _id),
    filter,
    cursor,
    mergeCommit ? mergeCommit._id : undefined,
    sort,
  )

  return environmentsState
}
