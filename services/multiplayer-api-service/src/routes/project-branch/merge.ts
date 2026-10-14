import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { ObjectId } from '@multiplayer/mongo'
import {
  EntityCommitModel,
  CommitModel,
  ProjectBranchModel,
  ICommitDocument,
  IEntityCommitDocument,
  EntityModel,
  IEntityDocument,
} from '@multiplayer/models'
import {
  ProjectBranchStatus,
  CommitType,
  EntityCommitStatus,
  EntityCommitChangeType,
  ErrorMessage,
  EntityUpdatedMessage,
  EntityCreatedMessage,
  EntityDeletedMessage,
  IEntityCommit,
} from '@multiplayer/types'
import {
  AMQPLib,
  ProjectLinkLib,
  GitRefTagLib,
} from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      projectBranchFrom,
      projectBranchTo,
    } = req
    const workspaceUsers = req.body.workspaceUsers
    const { entityCommits: entityCommitIds, excludedEntities = [] } = req.body

    const lastCommitFrom = await CommitModel.getLastCommitInBranch(projectBranchFrom._id)
    if (!lastCommitFrom) {
      throw new NotFoundError(ErrorMessage.FROM_BRANCH_STATE_NOT_FOUND)
    }

    const lastCommitTo = await CommitModel.getLastCommitInBranch(projectBranchTo._id)
    if (!lastCommitTo) {
      throw new NotFoundError(ErrorMessage.TO_BRANCH_STATE_NOT_FOUND)
    }

    const mergeCommitPayload: Partial<ICommitDocument> = {
      _id: new ObjectId(),
      workspace: lastCommitFrom.workspace,
      project: lastCommitFrom.project,
      projectBranch: projectBranchTo._id,
      mergeFromBranch: projectBranchFrom._id,
      mergeFromCommit: lastCommitFrom?._id,
      parentCommit: lastCommitTo?._id,
      message: `Merge branch ${projectBranchFrom.name} to ${projectBranchTo.name}`,
      type: CommitType.MERGE,
      entityCommits: [],
      workspaceUsers,
    }

    const entitiesToNotifyAbout: {
      updated: EntityUpdatedMessage[],
      created: EntityCreatedMessage[],
      deleted: EntityDeletedMessage[]
    } = {
      updated: [],
      created: [],
      deleted: [],
    }

    if (projectBranchFrom.default) {
      const entityCommits = await EntityCommitModel.findEntityCommitByIds(entityCommitIds)


      const { data: changesToBranch } = await EntityCommitModel.getChangesInBranch(
        projectBranchTo._id,
      )

      const { data: changesFromBranch } = await EntityCommitModel.getChangesInBranch(
        projectBranchFrom._id,
        {
          entity: changesToBranch.map(_entityCommit => _entityCommit.entity.entityId),
          afterCommit: projectBranchTo.parentCommit,
        },
      )

      await Promise.all(changesToBranch.map(_changeToBranch => {
        const baseChange = changesFromBranch.find(({ entity }) => entity.entityId.equals(_changeToBranch.entity.entityId))

        return EntityCommitModel.updateEntityCommitById(
          _changeToBranch.entityCommit._id,
          {
            baseEntityCommit: baseChange?.entityCommit._id,
          },
        )
      }))

      if (entityCommits.length) {
        await Promise.all(entityCommits.map(async entityCommit => {
          const baseChange = changesFromBranch.find(({ entity }) => entity.entityId.equals(entityCommit.entity))

          if (!baseChange) {
            throw new Error(ErrorMessage.INTERNAL_ERROR_NO_PARENT_ENTITY_COMMIT)
          }
          mergeCommitPayload?.entityCommits?.push(entityCommit._id)

          const updatedEntity = await EntityModel.updateEntityInBranch(
            entityCommit.entity,
            projectBranchTo._id,
            {
              metadata: baseChange.entity.metadata,
              key: baseChange.entity.key,
              keyAliases: baseChange.entity.keyAliases,
              latestEntityCommit: entityCommit._id,
            },
          ) as IEntityDocument

          entitiesToNotifyAbout.updated.push({
            entity: updatedEntity.toJSON(),
            entityUpdatedAt: updatedEntity.updatedAt || '',
            isDefaultBranch: !!projectBranchTo.default,
            branchId: projectBranchTo._id.toString(),
          })
          return EntityCommitModel.updateEntityCommitById(
            entityCommit._id,
            {
              baseEntityCommit: baseChange?.entityCommit?._id,
              commit: mergeCommitPayload._id,
            },
          )
        }))
      }
    } else {
      const { data: changesFromBranch } = await EntityCommitModel.getChangesInBranch(
        projectBranchFrom._id,
      )
      const entityCommitPayloads: Partial<IEntityCommitDocument>[] = []

      await Promise.all(changesFromBranch.map(async (changeFromBranch) => {
        if (excludedEntities.includes(changeFromBranch.entity.entityId.toString())) {
          return Promise.resolve()
        }
        const entityCommitPayload: Partial<IEntityCommitDocument> = {
          _id: new ObjectId(),
          workspace: lastCommitFrom.workspace,
          project: lastCommitFrom.project,
          projectBranch: projectBranchTo._id,
          parentEntityCommit: changeFromBranch?.entityCommit._id,
          changeType: changeFromBranch.entity.typeOfChangeInBranch,
          status: EntityCommitStatus.DONE,
          entity: changeFromBranch.entity.entityId,
          entityType: changeFromBranch.entity.type,
          commit: mergeCommitPayload._id,
          meta: changeFromBranch.entityCommit.meta,
          storageType: changeFromBranch.entityCommit.storageType,
          bucket: changeFromBranch.entityCommit.bucket,
          key: changeFromBranch.entityCommit.key,
          baseEntityCommit: changeFromBranch?.entityCommit._id,
        }

        entityCommitPayloads.push(entityCommitPayload)

        if (changeFromBranch.entity.typeOfChangeInBranch === EntityCommitChangeType.CREATE) {
          const entity = await EntityModel.createEntity({
            entityId: changeFromBranch.entity.entityId,
            workspace: changeFromBranch.entity.workspace,
            project: changeFromBranch.entity.project,
            projectBranch: projectBranchTo._id,
            type: changeFromBranch.entity.type,
            key: changeFromBranch.entity.key,
            keyAliases: changeFromBranch.entity.keyAliases,
            createdAtCommit: mergeCommitPayload._id,
            typeOfChangeInBranch: EntityCommitChangeType.CREATE,
            metadata: changeFromBranch.entity.metadata,
            latestEntityCommit: entityCommitPayload._id,
          })
          entitiesToNotifyAbout.created.push({
            entity: entity.toJSON(),
            entityCommit: entityCommitPayload as unknown as IEntityCommit,
            isDefaultBranch: !!projectBranchTo.default,
          })
        } else if (changeFromBranch.entity.typeOfChangeInBranch === EntityCommitChangeType.DELETE) {
          const entity = await EntityModel.updateEntityInBranch(
            changeFromBranch.entity.entityId,
            projectBranchTo._id,
            {
              deletedAtCommit: mergeCommitPayload._id,
              typeOfChangeInBranch: EntityCommitChangeType.DELETE,
              latestEntityCommit: entityCommitPayload._id,
            },
          )
          if (entity)
            entitiesToNotifyAbout.deleted.push({
              workspaceId: entity.workspace.toString(),
              projectId: entity.project.toString(),
              entityId: entity.entityId.toString(),
              branchId: entity.projectBranch.toString(),
              isDefaultBranch: !!projectBranchTo.default,
              entity: entity.toJSON(),
            })
        }
        else if (changeFromBranch.entity.typeOfChangeInBranch === EntityCommitChangeType.UPDATE) {
          const entity = await EntityModel.updateEntityInBranch(
            changeFromBranch.entity.entityId,
            projectBranchTo._id,
            {
              metadata: changeFromBranch.entity.metadata,
              key: changeFromBranch.entity.key,
              deletedAtCommit: null,
              typeOfChangeInBranch: EntityCommitChangeType.CREATE,
              latestEntityCommit: entityCommitPayload._id,
            },
          )
          if (entity)
            entitiesToNotifyAbout.updated.push({
              entity: entity.toJSON(),
              entityUpdatedAt: entity.updatedAt || '',
              isDefaultBranch: !!projectBranchTo.default,
              branchId: entity.projectBranch.toString(),
            })
        }
      }))

      const entityCommits = await EntityCommitModel.createEntityCommits(entityCommitPayloads)

      mergeCommitPayload.entityCommits = entityCommits.map(({ _id }) => _id)
    }

    const mergeCommit = await CommitModel.createCommit(mergeCommitPayload)

    if (!projectBranchFrom.default) {
      await ProjectBranchModel.updateProjectBranchById(
        projectBranchFrom._id,
        {
          status: ProjectBranchStatus.MERGED,
        },
      )

      await Promise.all([
        ProjectLinkLib.mergeProjectLinks(projectBranchFrom._id, projectBranchTo._id),
        GitRefTagLib.mergeGitRefTags(projectBranchFrom._id, projectBranchTo._id),
      ])
    }

    await ProjectBranchModel.updateProjectBranchById(
      projectBranchTo._id,
      {
        lastCommitMeta: {
          workspaceUsers,
          date: mergeCommit.createdAt,
        },
      },
    )

    const _mergeCommitResponse = mergeCommit.toJSON()
    _mergeCommitResponse.entityCommits.forEach((entityCommit: any) => {
      entityCommit.entity = entityCommit.entity.entityId
    })

    await notifyAboutChanges(entitiesToNotifyAbout)

    return res.status(200).json(_mergeCommitResponse)
  } catch (err) {
    return next(err)
  }
}

async function notifyAboutChanges(entities: {
  updated: EntityUpdatedMessage[]
  created: EntityCreatedMessage[]
  deleted: EntityDeletedMessage[]
}) {
  await Promise.all(entities.created.map((message) =>
    AMQPLib.notifyOnEntityCreate(message),
  ))
  await Promise.all(entities.deleted.map((message) =>
    AMQPLib.notifyOnEntityDelete(message),
  ))
  await Promise.all(entities.updated.map((message) =>
    AMQPLib.notifyOnEntityUpdate(message),
  ))
}
