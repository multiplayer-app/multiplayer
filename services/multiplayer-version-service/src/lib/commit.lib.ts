import {
  NotFoundError,
  InternalServerError,
} from 'restify-errors'
import { ObjectId } from '@multiplayer/mongo'
import {
  CommitType,
  EntityCommitChangeType,
  ErrorMessage, ICommit,
} from '@multiplayer/types'
import {
  CommitModel,
  ProjectBranchModel,
  EntityCommitModel,
  EntityModel,
  IProjectBranchDocument,
  ICommitDocument,
  IEntityCommitDocument,
  IPopulatedEntityStateDocument,
} from '@multiplayer/models'
import * as ProjectBranchLib from './project-branch.lib'

export const getLastCommit = async (
  projectBranchId: string | ObjectId,
): Promise<ICommitDocument | undefined> => {
  const projectBranch = await ProjectBranchLib.getBranchById(projectBranchId)

  let commit = await CommitModel.getLastCommitInBranch(projectBranch._id)

  if (!commit) {
    commit = await CommitModel.findCommitById(projectBranch.parentCommit as string)
  }
  return commit
}

export const getCommitById = async (
  commitId: string | ObjectId,
) => {
  const commit = await CommitModel.findCommitById(commitId)

  if (!commit) {
    throw new NotFoundError('COMMIT_NOT_FOUND')
  }

  return commit
}

export const createCommit = async (params: {
  projectBranch: IProjectBranchDocument,
  lastCommit: ICommitDocument,
  entityCommits: IEntityCommitDocument[],
  projectBranchState: IPopulatedEntityStateDocument[],
  message: string,
  label: string,
  type: CommitType,
  workspaceUsers: string[]
}): Promise<ICommit> => {

  const {
    projectBranch,
    lastCommit,
    entityCommits,
    projectBranchState,
    message,
    label,
    type,
    workspaceUsers,
  } = params

  const commitPayload: any = {
    _id: new ObjectId(),
    workspace: projectBranch.workspace,
    project: projectBranch.project,
    projectBranch: projectBranch._id,
    parentCommit: lastCommit._id,
    message,
    label,
    type,
    workspaceUsers,
    entityCommits: entityCommits.map(({ _id }) => (_id)),
  }

  if (!lastCommit.projectBranch.equals(projectBranch._id)) {
    commitPayload.mergeFromBranch = lastCommit.projectBranch
    commitPayload.mergeFromCommit = lastCommit._id
  }

  await Promise.all(entityCommits.map(async (entityCommit) => {
    const entityState = projectBranchState
      .find(({ entity }) => entityCommit.entity.equals(entity.entityId))

    if (
      entityCommit.changeType !== EntityCommitChangeType.CREATE
      && !entityState
    ) {
      throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_PARENT_ENTITY_STATE)
    }

    const promises: Array<Promise<any>> = []

    promises.push(EntityCommitModel.updateEntityCommitById(
      entityCommit._id,
      {
        commit: commitPayload._id,
        parentEntityCommit: entityState?.entityCommit?._id,
      },
    ))

    const entityUpdatePayload: {
      typeOfChangeInBranch?: EntityCommitChangeType,
      createdAtCommit?: any,
      deletedAtCommit?: any,
      archivedAtCommit?: any,
      metadata: Record<string, string> | undefined,
      latestEntityCommit: any
    } = {
      metadata: entityCommit.meta.summary,
      latestEntityCommit: entityCommit._id,
    }

    switch (entityCommit.changeType) {
      case EntityCommitChangeType.CREATE:
        if (entityState?.entityCommit) {
          throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_INVALID_COMMIT_CHANGE_TYPE)
        }
        entityUpdatePayload.createdAtCommit = commitPayload._id
        if (!entityUpdatePayload.typeOfChangeInBranch) {
          entityUpdatePayload.typeOfChangeInBranch = EntityCommitChangeType.CREATE
        }
        break
      case EntityCommitChangeType.ARCHIVE:
        entityUpdatePayload.archivedAtCommit = commitPayload._id
        if (!entityState?.entityCommit) {
          throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_PARENT_ENTITY_COMMIT)
        }
        if (
          !projectBranch._id.equals(entityState.entityCommit?.projectBranch)
          && !projectBranch.default
          && !entityUpdatePayload.typeOfChangeInBranch
        ) {
          entityUpdatePayload.typeOfChangeInBranch = EntityCommitChangeType.UPDATE
        }
        break
      case EntityCommitChangeType.UNARCHIVE:
        entityUpdatePayload.archivedAtCommit = null
        if (!entityState?.entityCommit) {
          throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_PARENT_ENTITY_COMMIT)
        }
        if (
          !projectBranch._id.equals(entityState.entityCommit?.projectBranch)
          && !projectBranch.default
          && !entityUpdatePayload.typeOfChangeInBranch
        ) {
          entityUpdatePayload.typeOfChangeInBranch = EntityCommitChangeType.UPDATE
        }
        break
      case EntityCommitChangeType.UPDATE:
        if (!entityState?.entityCommit) {
          throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_PARENT_ENTITY_COMMIT)
        }
        if (
          !projectBranch.default
          && !entityState.entityCommit?.projectBranch.equals(projectBranch._id)
          && !entityUpdatePayload.typeOfChangeInBranch
          && (
            entityState.entity.projectBranch.equals(projectBranch._id)
            && entityState.entity.typeOfChangeInBranch !== EntityCommitChangeType.CREATE
          )
        ) {
          entityUpdatePayload.typeOfChangeInBranch = EntityCommitChangeType.UPDATE
        }
        break
      case EntityCommitChangeType.DELETE:
        if (entityState?.entityCommit?.changeType === EntityCommitChangeType.DELETE) {
          throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_INVALID_COMMIT_CHANGE_TYPE)
        }
        if (!entityUpdatePayload.typeOfChangeInBranch) {
          entityUpdatePayload.typeOfChangeInBranch = EntityCommitChangeType.DELETE
        }
        entityUpdatePayload.deletedAtCommit = commitPayload._id
        break
    }

    promises.push(EntityModel.updateEntityInBranch(
      entityCommit.entity,
      projectBranch._id,
      entityUpdatePayload,
    ))

    await Promise.all(promises)
  }))

  const commit = await CommitModel.createCommit(commitPayload)

  await ProjectBranchModel.updateProjectBranchById(
    projectBranch._id,
    {
      lastCommitMeta: {
        workspaceUsers,
        date: commit.createdAt,
      },
    },
  )
  return commit.toJSON()
}
