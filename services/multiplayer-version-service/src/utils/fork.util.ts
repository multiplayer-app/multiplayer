import { ObjectId } from '@multiplayer/mongo'
import { s3 } from '@multiplayer/s3'
import logger from '@multiplayer/logger'
import { EntityConverter } from '@multiplayer/entity'
import {
  ProjectModel,
  WorkspaceModel,
  WorkspaceUserModel,
  RoleModel,
  IProjectDocument,
  IWorkspaceUserDocument,
  TeamModel,
  EntityModel,
  EntityCommitModel,
  ProjectBranchModel,
  CommitModel,
  ThreadModel,
  CommentModel,
  ProjectLinkModel,
  GitRefTagModel,
  GitRepositoryModel,
  PlatformRelationModel,
  EnvironmentModel,
  VariableSchemaModel,
  VariablesValueModel,
  IProjectBranchDocument,
} from '@multiplayer/models'
import { isFreeEmail, Username } from '@multiplayer/util-shared'
import {
  WorkspaceUserStatus,
  RoleType,
  EntityCommitStorageType,
  ProjectLinkObjectType,
  EntityCommitStatus,
  EntityCommitChangeType,
  EntityType,
  CommitType,
} from '@multiplayer/types'
import {
  WorkspaceLib,
  ProjectLib,
  UserLib,
  AMQPLib,
} from '../lib'
import { EntityCommitHelper } from '../helpers'
import { S3_PRIVATE_BUCKET } from '../config'
import { applyDocumentMigration, applyStateMigration } from '@multiplayer/entity/dist/converters'

const cloneProjectBranches = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  workspaceUser: IWorkspaceUserDocument,
  onlyLatestState?: boolean,
) => {
  for await (const projectBranchToClone of ProjectBranchModel.getProjectBranchesInProjectCursor(
    workspaceIdFrom,
    projectIdFrom,
    onlyLatestState ? { default: true } : undefined,
  )) {
    const {
      _id,
      workspace,
      project,
      parentProjectBranch,
      ...projectBranchToCloneObject
    } = projectBranchToClone.toObject()

    if (!idMappings.projectBranch[_id.toString()]) {
      idMappings.projectBranch[_id.toString()] = new ObjectId().toString()
    }

    const projectBranchPayload: any = {
      ...projectBranchToCloneObject,
      _id: idMappings.projectBranch[_id.toString()],
      workspace: workspaceIdTo,
      project: projectIdTo,
    }

    if (parentProjectBranch) {
      if (!idMappings.projectBranch[parentProjectBranch.toString()]) {
        idMappings.projectBranch[parentProjectBranch.toString()] = new ObjectId().toString()
      }

      projectBranchPayload.parentProjectBranch = idMappings.projectBranch[parentProjectBranch.toString()]
    }

    projectBranchPayload.reviews = (projectBranchPayload?.reviews || []).map(review => {
      review.workspaceUser = workspaceUser._id

      return review
    })

    if (projectBranchPayload.lastCommitMeta?.workspaceUsers?.length) {
      projectBranchPayload.lastCommitMeta.workspaceUsers = [workspaceUser._id]
    }

    await ProjectBranchModel.createProjectBranch(projectBranchPayload)
  }
}

const cloneEntities = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  onlyLatestState?: boolean,
) => {
  for await (const entityToClone of EntityModel.getEntitiesInProjectCursor(
    workspaceIdFrom,
    projectIdFrom,
    onlyLatestState ? {
      projectBranch: Object.keys(idMappings.projectBranch)[0],
      typeOfChangeInBranch: {
        $in: [
          EntityCommitChangeType.CREATE,
          EntityCommitChangeType.UPDATE,
        ],
      },
    } : undefined,
  )) {
    const {
      _id,
      workspace,
      entityId,
      projectBranch,
      createdAtCommit,
      archivedAtCommit,
      deletedAtCommit,
      latestEntityCommit,
      ...entityToCloneObject
    } = entityToClone.toObject()

    if (!idMappings.projectBranch[projectBranch.toString()]) {
      continue
    }

    if (!idMappings.entity[entityId.toString()]) {
      idMappings.entity[entityId.toString()] = new ObjectId().toString()
    }

    if (!idMappings.entityCommit[latestEntityCommit.toString()]) {
      idMappings.entityCommit[latestEntityCommit.toString()] = new ObjectId().toString()
    }

    const entityPayload: any = {
      ...entityToCloneObject,
      entityId: idMappings.entity[entityId.toString()],
      workspace: workspaceIdTo,
      project: projectIdTo,
      projectBranch: idMappings.projectBranch[projectBranch.toString()],
      latestEntityCommit: idMappings.entityCommit[latestEntityCommit.toString()],
    }

    if (createdAtCommit) {
      if (!idMappings.commit[createdAtCommit.toString()]) {
        idMappings.commit[createdAtCommit.toString()] = new ObjectId().toString()
      }

      entityPayload.createdAtCommit = idMappings.commit[createdAtCommit.toString()]
    }

    if (archivedAtCommit) {
      if (!idMappings.commit[archivedAtCommit.toString()]) {
        idMappings.commit[archivedAtCommit.toString()] = new ObjectId().toString()
      }

      entityPayload.archivedAtCommit = idMappings.commit[archivedAtCommit.toString()]
    }

    if (deletedAtCommit) {
      if (!idMappings.commit[deletedAtCommit.toString()]) {
        idMappings.commit[deletedAtCommit.toString()] = new ObjectId().toString()
      }

      entityPayload.deletedAtCommit = idMappings.commit[deletedAtCommit.toString()]
    }

    await EntityModel.createEntity(entityPayload)
  }
}

const _cloneEntityCommit = async (
  entityCommitToClone,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  defaultBranch: IProjectBranchDocument,
  onlyLatestState?: boolean,
) => {
  const {
    _id,
    workspace,
    entityId,
    projectBranch,
    commit,
    parentEntityCommit,
    entity,
    baseEntityCommit,
    bucket: bucketFrom,
    key: keyFrom,
    ...entityCommitToCloneObject
  } = entityCommitToClone.toObject()

  if (!idMappings.projectBranch[projectBranch.toString()]) {
    return
  }

  const entityCommitPayload: any = {
    ...entityCommitToCloneObject,
    workspace: workspaceIdTo,
    project: projectIdTo,
    projectBranch: idMappings.projectBranch[projectBranch.toString()],
    entity: idMappings.entity[entity.toString()],
  }

  if (!idMappings.entityCommit[_id.toString()]) {
    idMappings.entityCommit[_id.toString()] = new ObjectId().toString()
  }
  entityCommitPayload._id = idMappings.entityCommit[_id.toString()]

  if (commit) {
    if (onlyLatestState) {
      entityCommitPayload.commit = idMappings.commit['latest']
    } else {
      if (!idMappings.commit[commit.toString()]) {
        idMappings.commit[commit.toString()] = new ObjectId().toString()
      }
      entityCommitPayload.commit = idMappings.commit[commit.toString()]
    }
  }

  if (!onlyLatestState && parentEntityCommit) {
    if (!idMappings.entityCommit[parentEntityCommit.toString()]) {
      idMappings.entityCommit[parentEntityCommit.toString()] = new ObjectId().toString()
    }

    entityCommitPayload.parentEntityCommit = idMappings.entityCommit[parentEntityCommit.toString()]
  }

  if (!onlyLatestState && baseEntityCommit) {
    if (!idMappings.entityCommit[baseEntityCommit.toString()]) {
      idMappings.entityCommit[baseEntityCommit.toString()] = new ObjectId().toString()
    }

    entityCommitPayload.baseEntityCommit = idMappings.entityCommit[baseEntityCommit.toString()]
  }

  if (
    entityCommitPayload.storageType === EntityCommitStorageType.S3
    && bucketFrom
    && keyFrom
    && entityCommitPayload.status === EntityCommitStatus.DONE
  ) {
    const keyTo = EntityCommitHelper.getS3Key({
      workspaceId: workspaceIdTo.toString(),
      projectId: projectIdTo.toString(),
      entityId: entityCommitPayload.entity,
      entityCommitId: entityCommitPayload._id,
    })

    if (entityCommitPayload.entityType === EntityType.PLATFORM) {
      const document = await s3.downloadFileAsByteArray(
        keyFrom,
        bucketFrom,
      )

      if (!document) {
        throw new Error('Failed to get doc')
      }

      const objectDoc = EntityConverter.convertStateToData(
        entityCommitPayload.entityType,
        EntityConverter.applyStateMigration(entityCommitPayload.entityType, document),
      )

      let docString = JSON.stringify(objectDoc)

      for (const oldEntityId in idMappings.entity) {
        docString = docString.replace(new RegExp(oldEntityId, 'g'), idMappings.entity[oldEntityId])
      }

      await s3.uploadFile(
        keyTo,
        S3_PRIVATE_BUCKET,
        EntityConverter.convertDataToState(
          entityCommitPayload.entityType,
          JSON.parse(docString),
        ),
      )
    } else {
      await s3.copyBetweenBuckets(
        bucketFrom,
        keyFrom,
        S3_PRIVATE_BUCKET,
        keyTo,
      )
    }

    entityCommitPayload.bucket = S3_PRIVATE_BUCKET
    entityCommitPayload.key = keyTo
  }

  const copiedEntityCommit = await EntityCommitModel.createEntityCommit(entityCommitPayload)

  if (defaultBranch._id.equals(projectBranch._id)) {
    const entity = await EntityModel.getEntityInBranchByEntityId(
      copiedEntityCommit.entity,
      copiedEntityCommit.projectBranch,
    )

    if (!entity) {
      throw new Error('Failed to get entity')
    }
    await AMQPLib.notifyOnEntityCreate({
      entity: entity.toJSON(),
      entityCommit: copiedEntityCommit.toJSON(),
      isDefaultBranch: true,
    })
  }
}

const cloneEntityCommits = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  onlyLatestState?: boolean,
) => {
  const defaultBranch = await ProjectBranchModel.getDefaultProjectBranch(projectIdFrom)

  if (!defaultBranch) {
    throw new Error('Failed to get default project branch')
  }

  if (onlyLatestState) {
    for (
      const oldEntityCommitId of Object.keys(idMappings.entityCommit)
    ) {
      const entityCommitToClone = await EntityCommitModel.findEntityCommitById(oldEntityCommitId)

      await _cloneEntityCommit(
        entityCommitToClone,
        workspaceIdTo,
        projectIdTo,
        idMappings,
        defaultBranch,
        onlyLatestState,
      )
    }
  } else {
    for await (
      const entityCommitToClone of EntityCommitModel.getEntityCommitsInProjectCursor(workspaceIdFrom, projectIdFrom)
    ) {
      await _cloneEntityCommit(
        entityCommitToClone,
        workspaceIdTo,
        projectIdTo,
        idMappings,
        defaultBranch,
      )
    }
  }
}

const cloneCommits = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  workspaceUser: IWorkspaceUserDocument,
  onlyLatestState?: boolean,
) => {
  if (onlyLatestState) {
    const commitPayload: any = {
      // ...commitToCloneObject,
      _id: idMappings.commit['latest'],
      workspace: workspaceIdTo,
      project: projectIdTo,
      projectBranch: Object.values(idMappings.projectBranch)[0],
      workspaceUsers: [workspaceUser._id],
      entityCommits: Object.values(idMappings.entityCommit),
      type: CommitType.AUTO,
      message: 'Initial commit',
    }

    await CommitModel.createCommit(commitPayload)

    return
  }

  for await (const commitToClone of CommitModel.getCommitsInProjectCursor(workspaceIdFrom, projectIdFrom)) {
    const {
      _id,
      workspace,
      project,
      parentCommit,
      entityCommits,
      mergeFromBranch,
      mergeFromCommit,
      workspaceUsers,
      projectBranch,
      ...commitToCloneObject
    } = commitToClone.toObject()

    if (!idMappings.projectBranch[projectBranch.toString()]) {
      return
    }

    const commitPayload: any = {
      ...commitToCloneObject,
      workspace: workspaceIdTo,
      project: projectIdTo,
      projectBranch: idMappings.projectBranch[projectBranch.toString()],
    }

    if (!idMappings.commit[_id.toString()]) {
      idMappings.commit[_id.toString()] = new ObjectId().toString()
    }
    commitPayload._id = idMappings.commit[_id.toString()]

    if (parentCommit) {
      if (!idMappings.commit[parentCommit.toString()]) {
        idMappings.commit[parentCommit.toString()] = new ObjectId().toString()
      }
      commitPayload.parentCommit = idMappings.commit[parentCommit.toString()]
    }

    commitPayload.entityCommits = (entityCommits || [])
      .map(entityCommitId => idMappings.entityCommit[entityCommitId.toString()])

    if (mergeFromBranch) {
      commitPayload.mergeFromBranch = idMappings.projectBranch[mergeFromBranch.toString()]
    }

    if (mergeFromCommit) {
      commitPayload.mergeFromCommit = idMappings.commit[mergeFromCommit.toString()]
    }

    commitPayload.workspaceUsers = [workspaceUser._id]

    await CommitModel.createCommit(commitPayload)
  }
}

const cloneThreads = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  workspaceUser: IWorkspaceUserDocument,
  onlyLatestState?: boolean,
) => {
  for await (
    const threadToClone of ThreadModel.getThreadsInProjectCursor(
      workspaceIdFrom,
      projectIdFrom,
      onlyLatestState
        ? { branch: Object.keys(idMappings.projectBranch)[0] }
        : undefined,
    )
  ) {
    const {
      _id,
      workspace,
      project,
      branch,
      entity,
      initiator,
      usersInDiscussion,
      firstComment,
      ...threadToCloneObject
    } = threadToClone.toObject()

    if (!idMappings.projectBranch[branch.toString()]) {
      return
    }

    const threadPayload: any = {
      ...threadToCloneObject,
      _id: new ObjectId().toString(),
      workspace: workspaceIdTo,
      project: projectIdTo,
      branch: idMappings.projectBranch[branch.toString()],
      entity: idMappings.entity[entity.toString()],
      initiator: workspaceUser._id,
      usersInDiscussion: [workspaceUser._id],
    }

    idMappings.thread[_id.toString()] = threadPayload._id

    if (!idMappings.comment[firstComment.toString()]) {
      idMappings.comment[firstComment.toString()] = new ObjectId().toString()
    }
    threadPayload.firstComment = idMappings.comment[firstComment.toString()]

    await ThreadModel.createThread(threadPayload)
  }
}

const cloneComments = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  workspaceUser: IWorkspaceUserDocument,
  onlyLatestState?: boolean,
) => {
  for await (
    const commentToClone of CommentModel.getCommentsInProjectCursor(
      workspaceIdFrom,
      projectIdFrom,
      onlyLatestState
        ? { branch: Object.keys(idMappings.projectBranch)[0] }
        : undefined,
    )
  ) {
    const {
      _id,
      workspace,
      project,
      branch,
      entity,
      thread,
      workspaceUser,
      ...commentToCloneObject
    } = commentToClone.toObject()

    if (!idMappings.projectBranch[branch.toString()]) {
      return
    }

    const commentPayload: any = {
      ...commentToCloneObject,
      workspace: workspaceIdTo,
      project: projectIdTo,
      entity: idMappings.entity[entity.toString()],
      thread: idMappings.thread[thread.toString()],
      branch: idMappings.projectBranch[branch.toString()],
      workspaceUser: workspaceUser._id,
    }

    if (!idMappings.comment[_id.toString()]) {
      idMappings.comment[_id.toString()] = new ObjectId().toString()
    }
    commentPayload._id = idMappings.comment[_id.toString()]

    await CommentModel.createComment(commentPayload)
  }
}

const cloneGitRepositories = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
) => {
  for await (const gitRepositoryToClone of GitRepositoryModel.getGitRepositoriesInProjectCursor(workspaceIdFrom, projectIdFrom)) {
    const {
      _id,
      workspace,
      project,
      ...gitRepositoryToCloneObject
    } = gitRepositoryToClone.toObject()

    idMappings.gitRepository[_id.toString()] = new ObjectId().toString()

    const gitRepositoryPayload: any = {
      _id: idMappings.gitRepository[_id.toString()],
      workspace: workspaceIdTo,
      project: projectIdTo,
      ...gitRepositoryToCloneObject,
    }

    await GitRepositoryModel.createGitRepository(gitRepositoryPayload)
  }
}

const cloneGitRefTags = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  onlyLatestState?: boolean,
) => {
  for await (
    const gitRefTagToClone of GitRefTagModel.getGitRefTagsInProjectCursor(
      workspaceIdFrom,
      projectIdFrom,
      onlyLatestState
        ? { projectBranch: Object.keys(idMappings.projectBranch)[0] }
        : undefined,
    )
  ) {
    const {
      _id,
      gitRefTagId,
      workspace,
      project,
      projectBranch,
      tags,
      createdAtCommit,
      archivedAtCommit,
      deletedAtCommit,
      ...gitRefTagToCloneObject
    } = gitRefTagToClone.toObject()

    if (!idMappings.projectBranch[projectBranch.toString()]) {
      return
    }

    if (!idMappings.projectTag[gitRefTagId.toString()]) {
      idMappings.projectTag[gitRefTagId.toString()] = new ObjectId().toString()
    }

    const gitRefTagPayload: any = {
      ...gitRefTagToCloneObject,
      gitRefTagId: idMappings.projectTag[gitRefTagId.toString()],
      workspace: workspaceIdTo,
      project: projectIdTo,
      projectBranch: idMappings.projectBranch[projectBranch.toString()],
      tags,
    }

    if (createdAtCommit) {
      gitRefTagPayload.createdAtCommit = idMappings.commit[createdAtCommit.toString()]
    }
    if (archivedAtCommit) {
      gitRefTagPayload.archivedAtCommit = idMappings.commit[archivedAtCommit.toString()]
    }
    if (deletedAtCommit) {
      gitRefTagPayload.deletedAtCommit = idMappings.commit[deletedAtCommit.toString()]
    }

    await GitRefTagModel.createGitRefTag(gitRefTagPayload)
  }
}

const cloneProjectLinks = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  onlyLatestState?: boolean,
) => {
  for await (
    const projectLinkToClone of ProjectLinkModel.getProjectLinksInProjectCursor(
      workspaceIdFrom,
      projectIdFrom,
      onlyLatestState
        ? { projectBranch: Object.keys(idMappings.projectBranch)[0] }
        : undefined,
    )
  ) {
    const {
      _id,
      projectLinkId,
      workspace,
      project,
      projectBranch,
      createdAtCommit,
      archivedAtCommit,
      deletedAtCommit,
      ...projectLinkToCloneObject
    } = projectLinkToClone.toObject()

    if (!idMappings.projectBranch[projectBranch.toString()]) {
      return
    }

    if (!idMappings.projectLink[projectLinkId.toString()]) {
      idMappings.projectLink[projectLinkId.toString()] = new ObjectId().toString()
    }

    const projectLinkPayload: any = {
      ...projectLinkToCloneObject,
      projectLinkId: idMappings.projectLink[projectLinkId.toString()],
      workspace: workspaceIdTo,
      project: projectIdTo,
      projectBranch: idMappings.projectBranch[projectBranch.toString()],
    }

    if (createdAtCommit) {
      projectLinkPayload.createdAtCommit = idMappings.commit[createdAtCommit.toString()]
    }
    if (archivedAtCommit) {
      projectLinkPayload.archivedAtCommit = idMappings.commit[archivedAtCommit.toString()]
    }
    if (deletedAtCommit) {
      projectLinkPayload.deletedAtCommit = idMappings.commit[deletedAtCommit.toString()]
    }

    if (projectLinkPayload.sourceObjectType === ProjectLinkObjectType.Entity) {
      projectLinkPayload.sourceObject = idMappings.entity[projectLinkPayload.sourceObject.toString()]
    }

    if (projectLinkPayload.targetObjectType === ProjectLinkObjectType.Entity) {
      projectLinkPayload.targetObject = idMappings.entity[projectLinkPayload.targetObject.toString()]
    }

    await ProjectLinkModel.createProjectLink(projectLinkPayload)
  }
}

const clonePlatformRelations = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
  onlyLatestState?: boolean,
) => {
  for await (const platformRelationToClone of PlatformRelationModel.getPlatformRelationsInProjectCursor(
    workspaceIdFrom,
    projectIdFrom,
    onlyLatestState
      ? { projectBranch: Object.keys(idMappings.projectBranch)[0] }
      : undefined,
  )) {
    const {
      _id,
      workspace,
      project,
      projectBranch,
      parentEntity,
      sourceEntity,
      targetEntity,
      ...platformRelationToCloneObject
    } = platformRelationToClone.toObject()

    if (!idMappings.projectBranch[projectBranch.toString()]) {
      return
    }

    const platformRelationPayload: any = {
      ...platformRelationToCloneObject,
      workspace: workspaceIdTo,
      project: projectIdTo,
      projectBranch: idMappings.projectBranch[projectBranch.toString()],
      parentEntity: idMappings.entity[parentEntity.toString()],
      sourceEntity: idMappings.entity[sourceEntity.toString()],
      targetEntity: idMappings.entity[targetEntity.toString()],
    }

    await PlatformRelationModel.createPlatformRelation(platformRelationPayload)
  }
}

const cloneEnvironments = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
) => {
  for await (const environmentToClone of EnvironmentModel.getEnvironmentsInProjectCursor(workspaceIdFrom, projectIdFrom)) {
    const {
      _id,
      environmentId,
      workspace,
      project,
      projectBranch,
      tags,
      createdAtCommit,
      archivedAtCommit,
      deletedAtCommit,
      ...environmentToCloneObject
    } = environmentToClone.toObject()

    const environmentPayload: any = {
      ...environmentToCloneObject,
      workspace: workspaceIdTo,
      project: projectIdTo,
      tags: tags.map(tagId => idMappings.tag[tagId.toString()]),
      projectBranch: idMappings.projectBranch[projectBranch.toString()],
    }

    if (createdAtCommit) {
      environmentPayload.createdAtCommit = idMappings.commit[createdAtCommit.toString()]
    }
    if (archivedAtCommit) {
      environmentPayload.archivedAtCommit = idMappings.commit[archivedAtCommit.toString()]
    }
    if (deletedAtCommit) {
      environmentPayload.deletedAtCommit = idMappings.commit[deletedAtCommit.toString()]
    }

    if (!idMappings.environment[environmentId.toString()]) {
      idMappings.environment[environmentId.toString()] = new ObjectId().toString()
    }
    environmentPayload.environmentId = idMappings.environment[environmentId.toString()]

    await EnvironmentModel.createEnvironment(environmentPayload)
  }
}

const cloneVariableSchemas = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
) => {
  for await (const variableSchemaToClone of VariableSchemaModel.getVariableSchemasInProjectCursor(workspaceIdFrom, projectIdFrom)) {
    const {
      _id,
      variableSchemaId,
      workspace,
      project,
      projectBranch,
      createdAtCommit,
      archivedAtCommit,
      deletedAtCommit,
      ...variableSchemaToCloneObject
    } = variableSchemaToClone.toObject()

    if (!idMappings.variableSchema[variableSchemaId.toString()]) {
      idMappings.variableSchema[variableSchemaId.toString()] = new ObjectId().toString()
    }

    const variableSchemaPayload: any = {
      ...variableSchemaToCloneObject,
      variableSchemaId: idMappings.variableSchema[variableSchemaId.toString()],
      workspace: workspaceIdTo,
      project: projectIdTo,
    }

    if (createdAtCommit) {
      variableSchemaPayload.createdAtCommit = idMappings.commit[createdAtCommit.toString()]
    }
    if (archivedAtCommit) {
      variableSchemaPayload.archivedAtCommit = idMappings.commit[archivedAtCommit.toString()]
    }
    if (deletedAtCommit) {
      variableSchemaPayload.deletedAtCommit = idMappings.commit[deletedAtCommit.toString()]
    }

    await VariableSchemaModel.createVariableSchema(variableSchemaPayload)
  }
}

const cloneVariableValues = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  projectIdTo: string | ObjectId,
  idMappings,
) => {
  for await (const variableValueToClone of VariablesValueModel.getVariableValuesInProjectCursor(workspaceIdFrom, projectIdFrom)) {
    const {
      _id,
      variableValueId,
      workspace,
      project,
      projectBranch,
      entity,
      environment,
      variableSchema,
      createdAtCommit,
      archivedAtCommit,
      deletedAtCommit,
      ...variableValueToCloneObject
    } = variableValueToClone.toObject()

    if (!idMappings.variableValue[variableValueId.toString()]) {
      idMappings.variableValue[variableValueId.toString()] = new ObjectId().toString()
    }

    const variableValuePayload: any = {
      ...variableValueToCloneObject,
      variableValueId: idMappings.variableValue[variableValueId.toString()],
      workspace: workspaceIdTo,
      project: projectIdTo,
      entity: idMappings.entity[entity.toString()],
      environment: idMappings.environment[environment.toString()],
      variableSchema: idMappings.variableSchema[variableSchema.toString()],
      projectBranch: idMappings.projectBranch[projectBranch.toString()],
    }

    if (createdAtCommit) {
      variableValuePayload.createdAtCommit = idMappings.commit[createdAtCommit.toString()]
    }
    if (archivedAtCommit) {
      variableValuePayload.archivedAtCommit = idMappings.commit[archivedAtCommit.toString()]
    }
    if (deletedAtCommit) {
      variableValuePayload.deletedAtCommit = idMappings.commit[deletedAtCommit.toString()]
    }

    await VariablesValueModel.createVariableValue(variableValuePayload)
  }
}

export const cloneProject = async (
  workspaceIdFrom: string | ObjectId,
  projectIdFrom: string | ObjectId,
  workspaceIdTo: string | ObjectId,
  workspaceUser: IWorkspaceUserDocument,
  onlyLatestState?: boolean,
): Promise<IProjectDocument> => {
  const idMappings = {
    projectBranch: {},
    entity: {},
    commit: {},
    entityCommit: {},
    comment: {},
    thread: {},
    gitRefTag: {},
    projectLink: {},
    gitRepository: {},
    environment: {},
    variableSchema: {},
    variableValue: {},
    project: new ObjectId(),
  }

  if (onlyLatestState) {
    idMappings.commit['latest'] = new ObjectId().toString()
  }

  const projectToClone = await ProjectLib.getProjectById(projectIdFrom)

  const {
    _id,
    workspace,
    sample,
    template,
    ...projectToCloneObject
  } = projectToClone.toObject()
  const projectPayload: any = {
    ...projectToCloneObject,
    _id: idMappings.project,
    workspace: workspaceIdTo,
    sample: true,
  }

  // clone project branches
  await cloneProjectBranches(
    workspaceIdFrom,
    projectIdFrom,
    workspaceIdTo,
    idMappings.project,
    idMappings,
    workspaceUser,
    onlyLatestState,
  )
  logger.info(
    {
      project: idMappings.project,
      workspace: workspaceIdTo,
      workspaceUser: workspaceUser._id,
      onlyLatestState,
    },
    'Finished cloning project-branches',
  )

  // clone entities
  await cloneEntities(
    workspaceIdFrom,
    projectIdFrom,
    workspaceIdTo,
    idMappings.project,
    idMappings,
    onlyLatestState,
  )

  logger.info(
    {
      project: idMappings.project,
      workspace: workspaceIdTo,
      workspaceUser: workspaceUser._id,
      onlyLatestState,
    },
    'Finished cloning entities',
  )

  // clone entity-commits
  await cloneEntityCommits(
    workspaceIdFrom,
    projectIdFrom,
    workspaceIdTo,
    idMappings.project,
    idMappings,
    onlyLatestState,
  )

  logger.info(
    {
      project: idMappings.project,
      workspace: workspaceIdTo,
      workspaceUser: workspaceUser._id,
      onlyLatestState,
    },
    'Finished cloning entity-commits',
  )

  // clone commits
  await cloneCommits(
    workspaceIdFrom,
    projectIdFrom,
    workspaceIdTo,
    idMappings.project,
    idMappings,
    workspaceUser,
    onlyLatestState,
  )
  logger.info(
    {
      project: idMappings.project,
      workspace: workspaceIdTo,
      workspaceUser: workspaceUser._id,
      onlyLatestState,
    },
    'Finished cloning commits',
  )

  // clone git-repos
  await cloneGitRepositories(
    workspaceIdFrom,
    projectIdFrom,
    workspaceIdTo,
    idMappings.project,
    idMappings,
  )
  logger.info(
    {
      project: idMappings.project,
      workspace: workspaceIdTo,
      workspaceUser: workspaceUser._id,
    },
    'Finished cloning git-repos',
  )

  // clone project-tags
  await cloneGitRefTags(
    workspaceIdFrom,
    projectIdFrom,
    workspaceIdTo,
    idMappings.project,
    idMappings,
    onlyLatestState,
  )
  logger.info(
    {
      project: idMappings.project,
      workspace: workspaceIdTo,
      workspaceUser: workspaceUser._id,
      onlyLatestState,
    },
    'Finished cloning project-tags',
  )

  // clone project-links
  await cloneProjectLinks(
    workspaceIdFrom,
    projectIdFrom,
    workspaceIdTo,
    idMappings.project,
    idMappings,
    onlyLatestState,
  )
  logger.info(
    {
      project: idMappings.project,
      workspace: workspaceIdTo,
      workspaceUser: workspaceUser._id,
      onlyLatestState,
    },
    'Finished cloning project-links',
  )
  return ProjectModel.createProject(projectPayload)
}

export const cloneWorkspace = async (
  userId: string | ObjectId,
  workspaceId: string | ObjectId,
) => {
  const user = await UserLib.getUserById(userId)
  const workspaceToClone = await WorkspaceLib.getWorkspaceById(workspaceId)
  const workspaceOwnerRole = await RoleModel.findWorkspaceOwnerRole()
  const teamDefaultRole = await RoleModel.findDefaultRole(RoleType.PROJECT)

  const newWorkspaceId = new ObjectId()

  const workspaceUser = await WorkspaceUserModel.createWorkspaceUser({
    workspace: newWorkspaceId,
    user: user._id,
    username: Username.getUsernameFromEmail(user.primaryEmail),
    firstName: user.firstName,
    lastName: user.lastName,
    status: WorkspaceUserStatus.ACTIVE,
  })

  const {
    _id,
    users,
    ...workspaceToCloneObject
  } = workspaceToClone.toObject()
  const workspacePayload: any = {
    ...workspaceToCloneObject,
    _id: newWorkspaceId,
    users: [{
      workspaceUser: workspaceUser._id,
      role: workspaceOwnerRole._id,
    }],
  }

  if (user.primaryEmail && !isFreeEmail(user.primaryEmail)) {
    workspacePayload.domains = [{
      domain: user.primaryEmail.split('@')[1],
    }]
  }

  const team = await TeamModel.createTeam({
    workspace: newWorkspaceId,
    name: 'Dev',
    projects: [],
    users: [{
      _id: new ObjectId(),
      workspaceUser: workspaceUser._id,
      role: teamDefaultRole._id,
    }],
  })

  const newProjectIds: ObjectId[] = []

  for await (const projectToClone of ProjectModel.getProjectsCursorInWorkspace(workspaceToClone._id)) {
    const clonedProject = await cloneProject(
      workspaceToClone._id,
      projectToClone._id,
      newWorkspaceId,
      workspaceUser,
    )

    newProjectIds.push(clonedProject._id)
  }

  await TeamModel.addProject(
    team._id,
    newProjectIds,
  )
  return WorkspaceModel.createWorkspace(workspacePayload)
}
