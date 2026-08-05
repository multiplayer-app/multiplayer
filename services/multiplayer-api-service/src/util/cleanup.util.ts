import type { ObjectId } from '@multiplayer/mongo'
import logger from '@multiplayer/logger'
import { EntityCommitStatus, EntityCommitStorageType } from '@multiplayer/types'
import { s3 } from '@multiplayer/s3'
import {
  WorkspaceUserModel,
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
  IntegrationModel,
  EntityContentModel,
  ConditionalRecordingFiltersModel,
  IssueModel,
  IssueEndUserModel,
  EndUserModel,
} from '@multiplayer/models'

export const cleanupWorkspace = async (
  workspaceId: string | ObjectId,
) => {
  try {
    await VariablesValueModel.deleteVariableValuesByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted variable-values')
    await VariableSchemaModel.deleteVariableSchemasByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted variable-schemas')
    await EnvironmentModel.deleteEnvironmentByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted environments')
    await PlatformRelationModel.deletePlatformRelationsByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted platform-relations')
    await ProjectLinkModel.deleteProjectLinksByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted project-links')
    await GitRefTagModel.deleteGitRefTagsByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted git-ref-tags')
    await GitRepositoryModel.deleteGitRepositoriesByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted git-repositories')
    await CommentModel.deleteCommentsByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted comments')
    await ThreadModel.deleteThreadsByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted threads')
    await CommitModel.deleteCommitsByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted commits')

    for await (const entityCommit of EntityCommitModel.getEntityCommitsCursor({
      workspace: workspaceId,
      status: EntityCommitStatus.DONE,
      storageType: EntityCommitStorageType.S3,
    })) {
      await s3.deleteObject(
        entityCommit.bucket,
        entityCommit.key,
      )
    }
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted data from s3')
    await EntityCommitModel.deleteEntityCommitsByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted entity-commits')

    await EntityModel.deleteEntitiesByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted entities')
    await ProjectBranchModel.deleteProjectBranchesByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted project-branches')
    await IntegrationModel.deleteIntegrationsByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted integrations')
    await TeamModel.deleteTeamsByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted teams')
    await WorkspaceUserModel.deleteWorkspaceUsersByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted workspace-users')
    await EntityContentModel.deleteEntityContentByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted entity content')

    await ConditionalRecordingFiltersModel.deleteConditionalRecordingFiltersByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted ConditionalRecordingFiltersModel in workspace')

    await IssueModel.deleteIssuesByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted IssueModel in workspace')

    await IssueEndUserModel.deleteIssuesEndUsersByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted IssueEndUserModel in workspace')

    await EndUserModel.deleteEndUsersByWorkspace(workspaceId)
    logger.info({
      workspace: workspaceId,
    }, 'Successfully deleted EndUserModel in workspace')

    logger.info({
      workspace: workspaceId,
    }, 'Finished to cleanup workspace')
  } catch (error) {
    logger.error(error, `Failed to cleanup data for workspace ${workspaceId}`)
  }
}

export const cleanupProject = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
) => {
  try {
    await VariablesValueModel.deleteVariableValuesByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted variable-values')
    await VariableSchemaModel.deleteVariableSchemasByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted variable-schemas')
    await EnvironmentModel.deleteEnvironmentByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted environments')
    await PlatformRelationModel.deletePlatformRelationsByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted platform-relations')
    await ProjectLinkModel.deleteProjectLinksByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted project-links')
    await GitRefTagModel.deleteGitRefTagsByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted git-ref-tags')
    await GitRepositoryModel.deleteGitRepositoriesByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted git-repositories')
    await CommentModel.deleteCommentsByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted comments')
    await ThreadModel.deleteThreadsByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted threads')
    await CommitModel.deleteCommitsByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted commits')

    for await (const entityCommit of EntityCommitModel.getEntityCommitsCursor({
      workspace: workspaceId,
      project: projectId,
      status: EntityCommitStatus.DONE,
      storageType: EntityCommitStorageType.S3,
    })) {
      await s3.deleteObject(
        entityCommit.bucket,
        entityCommit.key,
      )
    }
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted data from s3')
    await EntityCommitModel.deleteEntityCommitsByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted entity-commits')

    await EntityModel.deleteEntitiesByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted entities')
    await ProjectBranchModel.deleteProjectBranchesByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted project-branch')
    await IntegrationModel.deleteIntegrationsByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted integrations')
    await EntityContentModel.deleteEntityContentByProject(workspaceId, projectId)
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted entity content')
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Finished to cleanup project')

    await ConditionalRecordingFiltersModel.deleteConditionalRecordingFiltersByProject(
      workspaceId,
      projectId,
    )
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted ConditionalRecordingFiltersModel in project')

    await IssueModel.deleteIssuesByProject(
      workspaceId,
      projectId,
    )
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted IssueModel in project')

    await IssueEndUserModel.deleteIssuesEndUsersByProject(
      workspaceId,
      projectId,
    )
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted IssueEndUserModel in project')

    await EndUserModel.deleteEndUsersByProject(
      workspaceId,
      projectId,
    )
    logger.info({
      workspace: workspaceId,
      project: projectId,
    }, 'Successfully deleted EndUserModel in project')
  } catch (error) {
    logger.error(error, `Failed to cleanup data for project ${projectId}`)
  }
}
