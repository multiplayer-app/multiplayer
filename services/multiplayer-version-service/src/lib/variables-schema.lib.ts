import { NotFoundError } from 'restify-errors'
import {
  ProjectBranchModel,
  CommitModel,
  ICommitDocument,
  IVariableSchemaDocument,
  VariableSchemaModel,
  ISortOptions,
} from '@multiplayer/models'
import {
  ICursor,
  IVariableSchema,
  DataWithCursor,
  ProjectBranchStatus,
} from '@multiplayer/types'

export const getVariableSchemaState = async (
  projectBranchId,
  filter?: Partial<IVariableSchema> & {
    archived?: boolean
  },
  cursor?: ICursor,
  sort?: ISortOptions,
): Promise<DataWithCursor<IVariableSchemaDocument>> => {
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

  const variableSchemas = await VariableSchemaModel.getVariableSchemasState(
    projectBranches.map(({ _id }) => _id),
    filter,
    cursor,
    mergeCommit ? mergeCommit._id : undefined,
    sort,
  )

  return variableSchemas
}
