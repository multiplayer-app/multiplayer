import { NotFoundError } from 'restify-errors'
import {
  ProjectBranchModel,
  CommitModel,
  ICommitDocument,
  GitRefTagModel,
  IGitRefTagDocument,
  ISortOptions,
} from '@multiplayer/models'
import {
  ICursor,
  IGitRefTag,
  DataWithCursor,
  ProjectBranchStatus,
  IntegrationTypeEnum,
  GitRefTagType,
} from '@multiplayer/types'
import { ObjectId } from '@multiplayer/mongo'
import * as CommitLib from './commit.lib'

export const getGitRefTagState = async (
  projectBranchId,
  filter?: Partial<IGitRefTag> & {
    archived?: boolean
    gitRefRepositoryId?: string
    gitRefBranch?: string
    gitRefPath?: string
    gitRefType?: IntegrationTypeEnum
    type?: GitRefTagType
  },
  cursor?: ICursor,
  sort?: ISortOptions,
): Promise<DataWithCursor<IGitRefTagDocument>> => {
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

  const gitRefTagState = await GitRefTagModel.getGitRefTagState(
    projectBranches.map(({ _id }) => _id),
    filter,
    cursor,
    mergeCommit ? mergeCommit._id : undefined,
    sort,
  )

  return gitRefTagState
}

export const mergeGitRefTags = async (
  fromBranchId: string | ObjectId,
  toBranchId: string | ObjectId,
): Promise<void> => {
  const updatedGitRefTags = await GitRefTagModel.findGitRefTags({
    projectBranch: fromBranchId as string,
    deletedAtCommit: {
      $exists: false,
    },
  })

  await GitRefTagModel.deleteGitRefTagsByIds(
    updatedGitRefTags.data.map(({ gitRefTagId }) => gitRefTagId),
    toBranchId,
  )

  await Promise.all(updatedGitRefTags.data.map(updatedGitRefTag => {
    const { _id, ..._updatedGitRefTag } = updatedGitRefTag

    return GitRefTagModel.createGitRefTag({
      ..._updatedGitRefTag,
      projectBranch: toBranchId as string,
    })
  }))

  const itemsToDelete = await GitRefTagModel.findDeletedGitRefTags(fromBranchId)
  const ids = itemsToDelete.map((item) => item.gitRefTagId)
  await GitRefTagModel.deleteManyGitRefTags({
    $or: [{
      gitRefTagId: { $in: ids },
      projectBranch: toBranchId,
    }, {
      projectBranch: fromBranchId,
    }],
  })
}

export async function updateGitRefTag(params: {
  payload: Partial<Pick<IGitRefTag, 'archivedAtCommit' | 'tags' | 'systemTags'>>,
  gitRefTagBeforeUpdate: IGitRefTagDocument,
  projectBranchId: string,
  gitRefTagId: string,
}) {
  let gitRefTag: IGitRefTagDocument | undefined

  if ((params.gitRefTagBeforeUpdate.projectBranch as ObjectId).equals(params.projectBranchId)) {
    gitRefTag = await GitRefTagModel.updateGitRefTagById(
      params.gitRefTagId,
      params.projectBranchId,
      params.payload,
    )
  } else {
    const { _id, ...oldGitRefTagObject } = params.gitRefTagBeforeUpdate

    gitRefTag = await GitRefTagModel.createGitRefTag({
      ...oldGitRefTagObject,
      ...params.payload,
      projectBranch: params.projectBranchId,
    })
  }

  return gitRefTag
}

export const deleteGitRefTag = async (
  projectBranchId: string | ObjectId,
  filter: {
    gitRefTagId?: string,
    objectId?: string
    type?: GitRefTagType
  },
): Promise<void> => {
  const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
  const lastCommit = await CommitLib.getLastCommit(projectBranchId)
  if (!lastCommit) {
    throw new NotFoundError(`lastCommit was not found for branch ${projectBranchId}!`)
  }

  const { data: gitRefTags } = await GitRefTagModel.getGitRefTagState(
    projectBranches.map(({ _id }) => _id),
    filter,
  )

  await Promise.all(gitRefTags.map(gitRefTag => {
    if ((gitRefTag.projectBranch as ObjectId).equals(projectBranchId)) {
      return GitRefTagModel.updateGitRefTagById(
        gitRefTag.gitRefTagId,
        projectBranchId,
        {
          deletedAtCommit: lastCommit._id.toString(),
        },
      )
    } else {
      const { _id, ...payload } = gitRefTag.toJSON()

      return GitRefTagModel.createGitRefTag({
        ...payload,
        projectBranch: projectBranchId,
        deletedAtCommit: lastCommit._id.toString(),
      })
    }
  }))
}
