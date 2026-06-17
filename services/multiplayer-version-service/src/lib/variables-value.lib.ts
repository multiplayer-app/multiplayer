import { NotFoundError } from 'restify-errors'
import {
  ProjectBranchModel,
  CommitModel,
  ICommitDocument,
  IVariableValueDocument,
  VariablesValueModel,
  ISortOptions,
} from '@multiplayer/models'
import {
  ICursor,
  IVariableValue,
  DataWithCursor,
  ProjectBranchStatus,
} from '@multiplayer/types'

export const getVariableValueState = async (
  projectBranchId,
  filter?: Partial<IVariableValue> & {
    archived?: boolean
  },
  cursor?: ICursor,
  sort?: ISortOptions,
): Promise<DataWithCursor<IVariableValueDocument>> => {
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

  const variableValue = await VariablesValueModel.getVariableValueState(
    projectBranches.map(({ _id }) => _id),
    filter,
    cursor,
    mergeCommit ? mergeCommit._id : undefined,
    sort,
  )

  return variableValue
}
