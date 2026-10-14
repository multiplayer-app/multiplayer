import { s3 } from '@multiplayer/s3'
import { EntityConverter, EntityDiffPatch, Y } from '@multiplayer/entity'
import { createEntityCommitWithEntityVersion } from './entity-commit.lib'
import {
  CommitType,
  EntityCommitChangeType,
  EntityCommitStatus,
  EntityCommitStorageType,
  EntityType,
  ErrorMessage,
  Platform,
  ProjectLinkObjectType,
  YjsUpdateStatus,
} from '@multiplayer/types'
import {
  EntityCommitModel, EntityContentModel,
  EntityUpdateContext,
  EntityUpdateModel,
  IEntityCommitDocument,
  IEntityDocument,
  IEntityUpdateDocument,
  IPopulatedEntityStateDocument,
  IProjectBranchDocument,
  ProjectBranchModel,
} from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { AMQPLib, CommitLib, ProjectLinkLib } from '.'
import { getLatestEntityState } from './project-branch.lib'
import { InternalError, NotFoundError } from 'restify-errors'

export class EntityUpdateLib {
  static areEqualStates(stateL: Uint8Array, stateR: Uint8Array) {
    if (stateL.length !== stateR.length) {
      return false
    }
    return stateL.every((value, index) => value === stateR[index])
  }

  static async commitUpdatesIfAvailable(projectBranch: IProjectBranchDocument, params: EntityUpdateContext) {
    const entityState = await getLatestEntityState(params.projectBranch, params.entityId)
    if (!entityState) {
      logger.info('Entity does not exist anymore', params)
      return
    }

    if (entityState.entityCommit.storageType !== EntityCommitStorageType.S3) {
      logger.info('Entity is static', params)
      return
    }

    const availableUpdates = await EntityUpdateModel.listEntityUpdates({
      workspace: params.workspace,
      project: params.project,
      projectBranch: params.projectBranch,
      entityId: params.entityId,
    }, {})

    if (!availableUpdates.data.length) {
      logger.info('Nothing to commit', params)
      return
    }

    return EntityUpdateLib.commitEntityUpdates(params, entityState, projectBranch, availableUpdates.data)
  }

  static async buildLatestEntityDoc(
    entityState: IPopulatedEntityStateDocument,
    availableUpdates: IEntityUpdateDocument[]) {
    const updatesToMerge = availableUpdates
      .filter(({ update }) => update)
      .map(({ update }) => new Uint8Array((update as Uint8Array).buffer))

    const updatesToLoad = availableUpdates
      .filter(({ update, key, bucket, status }) =>
        !update && key && bucket && status === YjsUpdateStatus.DONE)

    const loadedUpdates = await Promise.all(updatesToLoad.map(({ key, bucket }) => {
      return s3.downloadFileAsByteArray(key as string, bucket as string)
    }))

    const state = await s3.downloadFileAsByteArray(
      entityState.entityCommit.key as string,
      entityState.entityCommit.bucket as string) || EntityConverter.getInitialContent(entityState.entity.type, entityState.entity.metadata, entityState.entity.key)
    const oldDoc = EntityConverter.convertStateToData(entityState.entity.type, state)

    const doc = new Y.Doc()
    Y.applyUpdate(doc, state)
    Y.applyUpdate(doc, Y.mergeUpdates(updatesToMerge))
    loadedUpdates.forEach((data) => {
      if (!data) return
      try {
        Y.applyUpdate(doc, data)
      } catch (err) {
        logger.error(err)
      }
    })

    return { doc, oldDoc }
  }

  static async commitEntityUpdates(params: EntityUpdateContext,
    currentEntityState: IPopulatedEntityStateDocument,
    projectBranch: IProjectBranchDocument,
    availableUpdates: IEntityUpdateDocument[],
  ) {
    let entityState = currentEntityState
    if (!projectBranch._id.equals(entityState.entityCommit.projectBranch)) {
      // is first entity update in feature branch
      const parentBranch = await ProjectBranchModel.findProjectBranch(entityState.entityCommit.projectBranch, params.project, params.workspace)
      if (!parentBranch) {
        throw new NotFoundError(ErrorMessage.INTERNAL_ERROR_NO_PARENT_BRANCH)
      }
      //commit parent entity first
      await EntityUpdateLib.commitUpdatesIfAvailable(parentBranch, {
        workspace: params.workspace,
        project: params.project,
        projectBranch: parentBranch._id.toString(),
        entityId: params.entityId,
      })
      // re-fetch latest state
      const newState = await getLatestEntityState(params.projectBranch, params.entityId)
      if (!newState) {
        throw new InternalError(`Entity state is missed ${params.entityId}`)
      }

      entityState = newState
    }
    const updatesToLoad = availableUpdates
      .filter(({ update, key, bucket, status }) =>
        !update && key && bucket && status === YjsUpdateStatus.DONE)

    const { doc, oldDoc } = await EntityUpdateLib.buildLatestEntityDoc(entityState, availableUpdates)
    const newDoc = EntityConverter.convertYDocToData(entityState.entity.type, doc)
    await EntityContentModel.createEntityContent({
      workspace: params.workspace,
      project: params.project,
      projectBranch: params.projectBranch,
      type: entityState.entity.type,
      data: newDoc,
      entityId: entityState.entity.entityId,
    })
    const diff = EntityDiffPatch.getDiffBetweenData(oldDoc, newDoc, entityState.entity.type)

    if ((Array.isArray(diff) && diff.length) || (!Array.isArray(diff) && diff)) {
      const newState = Y.encodeStateAsUpdate(doc)
      const summary = EntityConverter.getSummaryFromState(entityState.entity.type, newState)

      const newEntityState = await createEntityCommitWithEntityVersion({
        entity: entityState.entity.projectBranch.equals(params.projectBranch) ? entityState.entity : undefined,
        entityId: params.entityId,
        projectBranch,
        payload: {
          changeType: EntityCommitChangeType.UPDATE,
          storageType: EntityCommitStorageType.S3,
          meta: { summary },
        },
      })

      await s3.uploadFile(
        newEntityState.entityCommit.key as string,
        newEntityState.entityCommit.bucket as string,
        newState,
      )
      const updatedEntityCommit = await EntityCommitModel.updateEntityCommitById(
        newEntityState.entityCommit._id,
        { status: EntityCommitStatus.DONE },
      )
      if (!updatedEntityCommit) {
        logger.error('EntityCommit was not found after creation!')
        return
      }

      const changeOwners = new Set(availableUpdates
        .filter(({ owner }) => owner)
        .map(({ owner }) => owner?.toString() as string),
      )
      const lastCommit = await CommitLib.getLastCommit(projectBranch._id)
      if (!lastCommit) {
        logger.error(`lastCommit was not found for branch ${projectBranch._id}!`)
        await Promise.all(availableUpdates.map(({ _id }) => EntityUpdateModel.deleteEntityUpdate(_id)))
        await Promise.all(updatesToLoad.map(({ key, bucket }) =>
          s3.deleteObject(bucket as string, key as string)),
        )
        return
      }
      const commit = await CommitLib.createCommit({
        projectBranch,
        lastCommit,
        entityCommits: [updatedEntityCommit],
        projectBranchState: [entityState],
        message: 'auto update',
        label: 'update',
        type: CommitType.AUTO,
        workspaceUsers: Array.from(changeOwners.values()),
      })
      await EntityUpdateLib.processEntityActions(entityState.entity, newDoc, commit._id.toString())

      await AMQPLib.notifyOnCommit({
        commit,
        entityCommits: commit.entityCommits as any as IEntityCommitDocument[],
        isDefaultBranch: !!projectBranch.default,
      })
    }
    await Promise.all(availableUpdates.map(({ _id }) => EntityUpdateModel.deleteEntityUpdate(_id)))
    await Promise.all(updatesToLoad.map(({ key, bucket }) =>
      s3.deleteObject(bucket as string, key as string)),
    )
  }

  static processEntityActions(entity: IEntityDocument, entityData: Platform, lastCommitId: string) {
    switch (entity.type) {
      case EntityType.PLATFORM:
        return EntityUpdateLib.processPlatform(entity, entityData, lastCommitId)
      default:
        return Promise.resolve()
    }
  }

  private static async processPlatform(entity: IEntityDocument, entityData: Platform, lastCommitId: string) {
    // auto create links to platform
    await Promise.all(Object.values(entityData.components).map((component) =>
      ProjectLinkLib.createProjectLink({
        workspaceId: entity.workspace.toString(),
        projectId: entity.project.toString(),
        projectBranchId: entity.projectBranch.toString(),
        lastCommitId,
        payload: {
          sourceObject: entity.entityId.toString(),
          sourceObjectType: ProjectLinkObjectType.Entity,
          targetObject: component.linkedTo,
          targetObjectType: ProjectLinkObjectType.Entity,
        },
      })))
  }
}


