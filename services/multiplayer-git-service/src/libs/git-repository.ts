import {
  GitRepositoryModel,
  IGitRepositoryDocument,
  IIntegrationDocument,
  ProjectLinkModel,
  GitRefTagModel,
} from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import {
  ErrorMessage,
  IntegrationTypeEnum,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { NotFoundError } from 'restify-errors'
import { GitProviderUtil } from '../util'
import { GitRepository } from '../types'

export const fetchGitRepositoryById = async (
  gitRepositoryId,
): Promise<IGitRepositoryDocument> => {
  const gitRepository = await GitRepositoryModel.findGitRepositoryById(gitRepositoryId)

  if (!gitRepository) {
    throw new NotFoundError('Git-Repository not found')
  }

  return gitRepository
}

export const fetchGitRepositoryByUrl = async (
  gitRepositoryUrl,
): Promise<IGitRepositoryDocument> => {
  const gitRepository = await GitRepositoryModel.findGitRepositoryByUrl(gitRepositoryUrl)

  if (!gitRepository) {
    throw new NotFoundError('Git-Repository not found')
  }

  return gitRepository
}

export const findGitRepositoryByName = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  gitRepositoryType: IntegrationTypeEnum.BITBUCKET | IntegrationTypeEnum.GITHUB | IntegrationTypeEnum.GITLAB,
  gitRepositoryOwner: string,
  gitRepositoryName: string,
): Promise<IGitRepositoryDocument> => {
  const gitRepository = await GitRepositoryModel.findGitRepositoryByName(
    workspaceId,
    projectId,
    gitRepositoryType,
    gitRepositoryOwner,
    gitRepositoryName,
  )

  if (!gitRepository) {
    throw new NotFoundError(ErrorMessage.GIT_REPOSITORY_NOT_FOUND)
  }

  return gitRepository
}

export const fetchGitRepositoryByGitId = async (
  workspaceId: string,
  projectId: string,
  gitRepositoryId,
): Promise<IGitRepositoryDocument> => {
  const gitRepository = await GitRepositoryModel.findGitRepositoryByGitId(
    gitRepositoryId,
    workspaceId,
    projectId,
  )

  if (!gitRepository) {
    throw new NotFoundError('Git-Repository not found')
  }

  return gitRepository
}

export const bulkUpdateGitRepositoryAccess = async (params: {
  workspaceId: string,
  gitRepo: GitRepository,
  integration: IIntegrationDocument,
  projects: string[],
  archived: boolean, // why should we allow archiving the user source?
}) => {
  const {
    workspaceId,
    gitRepo,
    integration,
    projects,
    archived,
  } = params
  const { data: gitRepositoriesBeforeBulk } = await GitRepositoryModel.findGitRepositories({
    workspace: workspaceId,
    gitRepositoryId: gitRepo._id,
  })

  const addProjectIds = projects
    .filter(projectId => !gitRepositoriesBeforeBulk.find(({ project }) => project.equals(projectId)))

  const gitReposToDelete = gitRepositoriesBeforeBulk
    .filter(({ project }) => !projects.find((projectId: string) => project.equals(projectId)))

  if (addProjectIds.length) {
    await GitRepositoryModel.createGitRepositories(addProjectIds.map((projectId) => ({
      archived,
      project: projectId,
      workspace: workspaceId,
      gitRepository: {
        _id: gitRepo._id,
        id: gitRepo.id,
        type: integration.type,
        name: gitRepo.name,
        owner: gitRepo.owner.name,
        private: gitRepo.private,
        defaultBranch: gitRepo.defaultBranch,
        url: gitRepo.url,
      },
    })))
  }

  if (gitReposToDelete.length) {
    await Promise.all(gitReposToDelete.map((gitRepoToDelete) =>
      deleteGitRepositoryWithRelations(gitRepoToDelete, integration, false)))
  }

  const gitRepositories = await GitRepositoryModel.findGitRepositories({
    workspace: workspaceId,
    gitRepositoryId: gitRepo._id,
  })

  try {
    if (gitRepositories.data.length) {
      await GitProviderUtil.upsertWebhook(
        integration,
        gitRepo._id,
      )
    } else {
      await GitProviderUtil.deleteWebhook(
        integration,
        gitRepo._id,
      )
    }
  } catch (webhookError) {
    logger.error(
      webhookError,
      `Failed to ${gitRepositories.data.length ? 'upsert' : 'delete'} webhook for git repo ${integration.type} ${gitRepo._id}`,
    )
  }

  return gitRepositories
}

export const deleteGitRepositoryWithRelations = async (
  gitRepository: IGitRepositoryDocument,
  integration: IIntegrationDocument | undefined,
  removeWebhook = true,
) => {
  if (removeWebhook && integration) {
    await GitProviderUtil.deleteWebhook(
      integration,
      gitRepository?.gitRepository._id,
    )
  }

  await ProjectLinkModel.deleteProjectLinksByRepository(
    gitRepository.workspace,
    gitRepository.project,
    gitRepository.gitRepository.type,
    gitRepository.gitRepository.id,
  )

  await GitRefTagModel.deleteGitRefTagsByRepository(
    gitRepository.workspace,
    gitRepository.project,
    gitRepository.gitRepository.type,
    gitRepository.gitRepository.id,
  )

  await GitRepositoryModel.deleteGitRepositoryById(
    gitRepository._id,
  )
}
