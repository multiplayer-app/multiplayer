import { Stream } from 'stream'
import { NotFoundError } from 'restify-errors'
import logger from '@multiplayer/logger'
import {
  IntegrationModel,
  IIntegrationDocument,
  GitRepositoryModel,
} from '@multiplayer/models'
import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
} from '@multiplayer/types'
import {
  GitHubApi,
  GitLabApi,
  BitBucketApi,
  GitHubApp,
} from '../libs'
import {
  CommitContent,
  GitBranch,
  GitCommit,
  DataWithGitCursor,
  GitTag,
  GitRepository,
} from '../types'
import {
  API_PREFIX,
  API_DOMAIN,
  API_PROTOCOL,
} from '../config'

const webhookUrls = {
  [IntegrationTypeEnum.BITBUCKET]: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/webhooks/bitbucket`,
  [IntegrationTypeEnum.GITLAB]: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/webhooks/gitlab`,
  [IntegrationTypeEnum.GITHUB]: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/integrations/github-app/webhooks`,
}

const validateIntegrationMetadata = (integration?: IIntegrationDocument) => {
  if (!integration?._id) {
    return
  }

  if (
    integration.type === IntegrationTypeEnum.GITHUB
    && !integration?.github?.installationId
  ) {
    throw new Error('Missing access token or installation id')
  } else if (
    integration.type === IntegrationTypeEnum.GITLAB
    && !integration?.gitlab?.accessToken
  ) {
    throw new Error('Missing GitLab token')
  } else if (
    integration.type === IntegrationTypeEnum.BITBUCKET
    && !integration?.gitlab?.accessToken
  ) {
    throw new Error('Missing BitBucket token')
  }
}

const refreshAccessToken = async (integration: IIntegrationDocument) => {
  validateIntegrationMetadata(integration)
  let _integration = integration

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    if (!integration.bitbucket?.refreshToken) {
      throw new Error('Missing BitBucket refresh token')
    }

    const refreshTokenData = await BitBucketApi.refreshAccessToken(
      integration.bitbucket.refreshToken,
    )

    _integration = await IntegrationModel.updateIntegrationById(
      integration._id,
      {
        bitbucket: {
          accessToken: refreshTokenData.accessToken,
          refreshToken: refreshTokenData.refreshToken,
        },
      },
    ) as IIntegrationDocument
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    if (!integration.gitlab?.refreshToken) {
      throw new Error('Missing GitLab refresh token')
    }

    const refreshTokenData = await GitLabApi.refreshAccessToken(
      integration.gitlab.refreshToken,
    )

    _integration = await IntegrationModel.updateIntegrationById(
      integration._id,
      {
        gitlab: {
          accessToken: refreshTokenData.accessToken,
          refreshToken: refreshTokenData.refreshToken,
        },
      },
    ) as IIntegrationDocument
  }

  return _integration
}

export const listRepositories = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  page: number,
  perPage: number,
  repositoryName?: string,
) => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let repositories

  if (integration?.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      repositories = await BitBucketApi.listRepositories(
        page,
        perPage,
        repositoryName,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )
    } catch (error: any) {

      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        repositories = await BitBucketApi.listRepositories(
          page,
          perPage,
          repositoryName,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      repositories = await GitLabApi.listRepositories(
        page,
        perPage,
        repositoryName,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        repositories = await GitLabApi.listRepositories(
          page,
          perPage,
          repositoryName,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (
      (integration as IIntegrationDocument)?._id
      && (integration as IIntegrationDocument)?.github?.installationId
      && (integration as IIntegrationDocument)?.authType === IntegrationAuthTypeEnum.GITHUB_APP
    ) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument)?.github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    repositories = await GitHubApi.listRepositories(
      page,
      perPage,
      repositoryName,
      (integration as IIntegrationDocument)?.authType,
      accessToken,
    )
  }

  return repositories
}

export const getRepository = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  repositoryId: string,
): Promise<GitRepository> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)
  let repository

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      repository = await BitBucketApi.getRepository(
        repositoryId,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )
    } catch (error: any) {
      if (error?.response?.error?.message
        ?.startsWith('You may not have access to this repository or it no longer exists in this workspace.')) {
        throw new NotFoundError('Git repository not found')
      } else if ((integration as IIntegrationDocument)?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        repository = await BitBucketApi.getRepository(
          repositoryId,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      repository = await GitLabApi.getRepository(
        repositoryId,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (error?.response?.message === '404 Project Not Found') {
        throw new NotFoundError('Git repository not found')
      } else if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        repository = await GitLabApi.getRepository(
          repositoryId,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    try {
      let accessToken

      if (
        (integration as IIntegrationDocument)?.authType === IntegrationAuthTypeEnum.GITHUB_APP
      ) {
        accessToken = await GitHubApp.getInstallationToken(
          (integration as IIntegrationDocument).github?.installationId as number,
        )
      } else {
        accessToken = (integration as IIntegrationDocument)?.github?.accessToken
      }

      repository = await GitHubApi.getRepository(
        repositoryId,
        accessToken,
      )
    } catch (fetchRepoError: any) {
      if (
        fetchRepoError.response?.message === 'Not Found'
        && fetchRepoError.response?.status === '404'
        && fetchRepoError.response?.documentation_url
      ) {
        throw new NotFoundError('Git repository not found')
      }

      throw fetchRepoError
    }
  }

  return repository
}

export const listBranches = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  repositoryId: string,
  page: number,
  perPage: number,
): Promise<DataWithGitCursor<GitBranch>> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let branches

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      branches = await BitBucketApi.listBranches(
        repositoryId,
        page,
        perPage,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        branches = await BitBucketApi.listBranches(
          repositoryId,
          page,
          perPage,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      branches = await GitLabApi.listBranches(
        repositoryId,
        page,
        perPage,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        branches = await GitLabApi.listBranches(
          repositoryId,
          page,
          perPage,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (
      (integration as IIntegrationDocument)?.authType === IntegrationAuthTypeEnum.GITHUB_APP
    ) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument)?.github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    branches = await GitHubApi.listBranches(
      repositoryId,
      page,
      perPage,
      accessToken,
    )
  }

  return branches
}

export const listTags = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  repositoryId: string,
  page: number,
  perPage: number,
): Promise<DataWithGitCursor<GitTag>> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let tags

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      tags = await BitBucketApi.listTags(
        repositoryId,
        page,
        perPage,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        tags = await BitBucketApi.listTags(
          repositoryId,
          page,
          perPage,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      tags = await GitLabApi.listTags(
        repositoryId,
        page,
        perPage,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        tags = await GitLabApi.listTags(
          repositoryId,
          page,
          perPage,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (
      (integration as IIntegrationDocument)?.authType === IntegrationAuthTypeEnum.GITHUB_APP
    ) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument).github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    tags = await GitHubApi.listTags(
      repositoryId,
      page,
      perPage,
      accessToken,
    )
  }

  return tags
}

export const getRepositoryTree = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  repositoryId: string,
  ref: string,
  path: string,
  page: string,
  perPage: number,
) => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let tree

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      tree = await BitBucketApi.getRepositoryTree(
        repositoryId,
        ref,
        path,
        page,
        perPage,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )

    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        tree = await BitBucketApi.getRepositoryTree(
          repositoryId,
          ref,
          path,
          page,
          perPage,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      tree = await GitLabApi.getRepositoryTree(
        repositoryId,
        ref,
        path,
        Number(page),
        perPage,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        tree = await GitLabApi.getRepositoryTree(
          repositoryId,
          ref,
          path,
          Number(page),
          perPage,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (
      (integration as IIntegrationDocument)?.authType === IntegrationAuthTypeEnum.GITHUB_APP
    ) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument).github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    tree = await GitHubApi.getRepositoryTree(
      repositoryId,
      ref,
      path,
      Number(page),
      perPage,
      accessToken,
    )
  }

  return tree
}

export const getFileContents = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  repositoryId: string,
  ref: string,
  path: string,
): Promise<Stream> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let fileContent

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      fileContent = await BitBucketApi.getFileContents(
        repositoryId,
        ref,
        path,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )

    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        fileContent = await BitBucketApi.getFileContents(
          repositoryId,
          ref,
          path,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      fileContent = await GitLabApi.getFileContents(
        repositoryId,
        ref,
        path,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        fileContent = await GitLabApi.getFileContents(
          repositoryId,
          ref,
          path,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (
      (integration as IIntegrationDocument).authType === IntegrationAuthTypeEnum.GITHUB_APP
    ) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument).github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    fileContent = await GitHubApi.getFileContents(
      repositoryId,
      ref,
      path,
      accessToken,
    )
  }

  return fileContent
}

export const getBranch = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  repositoryId: string,
  branchName: string,
): Promise<GitBranch> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let branch

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      branch = await BitBucketApi.getBranch(
        repositoryId,
        branchName,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )

    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        branch = await BitBucketApi.getBranch(
          repositoryId,
          branchName,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      branch = await GitLabApi.getBranch(
        repositoryId,
        branchName,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        branch = await GitLabApi.getBranch(
          repositoryId,
          branchName,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (
      (integration as IIntegrationDocument)?.authType === IntegrationAuthTypeEnum.GITHUB_APP
    ) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument).github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    branch = await GitHubApi.getBranch(
      repositoryId,
      branchName,
      accessToken,
    )
  }

  return branch
}

export const createBranch = async (
  integration: IIntegrationDocument,
  repositoryId: string,
  newBranchName: string,
  parentCommitSha: string,
): Promise<object> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let branch

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      branch = await BitBucketApi.createBranch(
        repositoryId,
        newBranchName,
        parentCommitSha,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
      )

    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration)

        branch = await BitBucketApi.createBranch(
          repositoryId,
          newBranchName,
          parentCommitSha,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      branch = await GitLabApi.createBranch(
        repositoryId,
        newBranchName,
        parentCommitSha,
        (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
      )
    } catch (error: any) {
      if (
        integration?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration)

        branch = await GitLabApi.createBranch(
          repositoryId,
          newBranchName,
          parentCommitSha,
          (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (integration.authType === IntegrationAuthTypeEnum.GITHUB_APP) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument).github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    branch = await GitHubApi.createBranch(
      repositoryId,
      newBranchName,
      parentCommitSha,
      accessToken,
    )
  }

  return branch
}

export const createCommit = async (
  integration: IIntegrationDocument,
  repositoryId: string,
  branchName: string,
  commitMessage: string,
  contents: CommitContent[],
): Promise<GitCommit> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let commit

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      commit = await BitBucketApi.createCommit(
        repositoryId,
        branchName,
        commitMessage,
        contents,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
      )

    } catch (error: any) {
      if (integration?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration)

        commit = await BitBucketApi.createCommit(
          repositoryId,
          branchName,
          commitMessage,
          contents,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      commit = await GitLabApi.createCommit(
        repositoryId,
        branchName,
        commitMessage,
        contents,
        (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
      )
    } catch (error: any) {
      if (integration?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration)

        commit = await GitLabApi.createCommit(
          repositoryId,
          branchName,
          commitMessage,
          contents,
          (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (integration.authType === IntegrationAuthTypeEnum.GITHUB_APP) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument).github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    commit = await GitHubApi.createCommit(
      repositoryId,
      branchName,
      commitMessage,
      contents,
      accessToken,
    )
  }

  return commit
}

export const createWebhook = async (
  integration: IIntegrationDocument,
  repositoryId: string,
): Promise<any> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      return BitBucketApi.createWebhook(
        repositoryId,
        webhookUrls[IntegrationTypeEnum.BITBUCKET],
        (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
      )
    } catch (error: any) {
      if (integration?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration)

        return BitBucketApi.createWebhook(
          repositoryId,
          webhookUrls[IntegrationTypeEnum.BITBUCKET],
          (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      return GitLabApi.createWebhook(
        repositoryId,
        webhookUrls[IntegrationTypeEnum.GITLAB],
        (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
      )
    } catch (error: any) {
      if (integration?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration)

        return GitLabApi.createWebhook(
          repositoryId,
          webhookUrls[IntegrationTypeEnum.GITLAB],
          (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  }
}

export const getWebhooks = async (
  integration: IIntegrationDocument,
  repositoryId: string,
): Promise<{ url: string, id: string }[]> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      return BitBucketApi.getWebhooks(
        repositoryId,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
      )

    } catch (error: any) {
      if (integration?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration)

        return BitBucketApi.getWebhooks(
          repositoryId,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      return GitLabApi.getWebhooks(
        repositoryId,
        (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
      )
    } catch (error: any) {
      if (integration?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration)

        return GitLabApi.getWebhooks(
          repositoryId,
          (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  } else {
    throw new Error('Unknown integration type')
  }
}

export const deleteWebhookById = async (
  integration: IIntegrationDocument,
  repositoryId: string,
  webhookId: string,
): Promise<void> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      await BitBucketApi.deleteWebhook(
        repositoryId,
        webhookId,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
      )

    } catch (error: any) {
      if (integration?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration)

        await BitBucketApi.deleteWebhook(
          repositoryId,
          webhookId,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      await GitLabApi.deleteWebhook(
        repositoryId,
        webhookId,
        (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
      )
    } catch (error: any) {
      if (integration?._id && error?.response?.status === 401) {
        integration = await refreshAccessToken(integration)

        await GitLabApi.deleteWebhook(
          repositoryId,
          webhookId,
          (integration as IIntegrationDocument)?.gitlab?.accessToken as string,
        )
      } else {
        throw error
      }
    }
  }
}

export const upsertWebhook = async (
  integration: IIntegrationDocument,
  repositoryId: string,
) => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  if (
    ![IntegrationTypeEnum.BITBUCKET, IntegrationTypeEnum.GITLAB].includes(integration.type)
  ) {
    return
  }
  const webhooks = await getWebhooks(integration, repositoryId)

  const webhookUrl = webhookUrls[integration.type]
  const isWebhookExists = webhooks.find(({ url }) => url === webhookUrl)

  if (isWebhookExists) {
    return
  }

  const webhook = await createWebhook(
    integration,
    repositoryId,
  )

  logger.debug(`Created ${integration.type} webhook ${webhook.id} at ${repositoryId}`)
}

export const deleteWebhook = async (
  integration: IIntegrationDocument,
  repositoryId: string,
) => {
  validateIntegrationMetadata(integration)

  if (
    ![IntegrationTypeEnum.BITBUCKET, IntegrationTypeEnum.GITLAB].includes(integration.type)
  ) {
    return
  }

  const gitRepos = await GitRepositoryModel.findGitRepositories({
    gitRepositoryId: repositoryId,
  })

  if (!gitRepos.data.length) {
    const webhooks = await getWebhooks(integration, repositoryId)

    const webhookUrl = webhookUrls[integration.type]
    const webhook = webhooks.find(({ url }) => url === webhookUrl)

    if (webhook) {
      await deleteWebhookById(
        integration,
        repositoryId,
        webhook.id,
      )
      logger.debug(`Deleted ${integration.type} webhook ${webhook.id} from ${repositoryId}`)
    } else {
      logger.debug(`Webhook ${integration.type} for ${repositoryId} not found`)
    }

  }
}

export const getCommit = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  repositoryId: string,
  commitSha: string,
): Promise<GitCommit> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let commit

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      commit = await BitBucketApi.getCommit(
        repositoryId,
        commitSha,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )

    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        commit = await BitBucketApi.getCommit(
          repositoryId,
          commitSha,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      commit = await GitLabApi.getCommit(
        repositoryId,
        commitSha,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        commit = await GitLabApi.getCommit(
          repositoryId,
          commitSha,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else {
    throw new Error('Unknown integration type')
  }

  return commit
}


export const createPullRequest = async (
  integration: IIntegrationDocument | { type: IntegrationTypeEnum },
  repositoryId: string,
  branchName: string,
  baseBranch: string | undefined,
  title: string,
  description?: string,
): Promise<string> => {
  validateIntegrationMetadata(integration as IIntegrationDocument)

  let prUrl

  if (!baseBranch) {
    const gitRepo = await getRepository(
      integration,
      repositoryId,
    )

    if (!gitRepo) {
      throw new Error('GitRepository not found')
    }

    baseBranch = gitRepo.defaultBranch
  }

  if (integration.type === IntegrationTypeEnum.BITBUCKET) {
    try {
      prUrl = await BitBucketApi.createPullRequest(
        repositoryId,
        branchName,
        baseBranch,
        title,
        description,
        (integration as IIntegrationDocument)?.bitbucket?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        prUrl = await BitBucketApi.createPullRequest(
          repositoryId,
          branchName,
          baseBranch,
          title,
          description,
          (integration as IIntegrationDocument)?.bitbucket?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITLAB) {
    try {
      prUrl = await GitLabApi.createPullRequest(
        repositoryId,
        branchName,
        baseBranch,
        title,
        description,
        (integration as IIntegrationDocument)?.gitlab?.accessToken,
      )
    } catch (error: any) {
      if (
        (integration as IIntegrationDocument)?._id
        && error?.response?.status === 401
      ) {
        integration = await refreshAccessToken(integration as IIntegrationDocument)

        prUrl = await GitLabApi.createPullRequest(
          repositoryId,
          branchName,
          baseBranch,
          title,
          description,
          (integration as IIntegrationDocument)?.gitlab?.accessToken,
        )
      } else {
        throw error
      }
    }
  } else if (integration.type === IntegrationTypeEnum.GITHUB) {
    let accessToken

    if (
      (integration as IIntegrationDocument)?.authType === IntegrationAuthTypeEnum.GITHUB_APP
    ) {
      accessToken = await GitHubApp.getInstallationToken(
        (integration as IIntegrationDocument)?.github?.installationId as number,
      )
    } else {
      accessToken = (integration as IIntegrationDocument)?.github?.accessToken
    }

    prUrl = await GitHubApi.createPullRequest(
      repositoryId,
      branchName,
      baseBranch,
      title,
      description,
      accessToken,
    )
  }

  return prUrl
}

// export const listPublicRepositories = async (
//   gitProviderType: IntegrationTypeEnum,
//   page: number,
//   perPage: number,
//   repositoryName?: string,
// ) => {
//   let repositories

//   if (gitProviderType === IntegrationTypeEnum.BITBUCKET) {
//     repositories = await BitBucketApi.listPublicRepositories(
//       page,
//       perPage,
//       repositoryName,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITLAB) {
//     repositories = await GitLabApi.listPublicRepositories(
//       page,
//       perPage,
//       repositoryName,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITHUB) {
//     repositories = await GitHubApi.listPublicRepositories(
//       page,
//       perPage,
//       repositoryName,
//     )
//   }

//   return repositories
// }

// export const getPublicRepository = async (
//   type: IntegrationTypeEnum,
//   repositoryId: string,
// ): Promise<GitRepository> => {
//   let repository

//   if (type === IntegrationTypeEnum.BITBUCKET) {
//     // try {
//     repository = await BitBucketApi.getPublicRepository(repositoryId)
//     // } catch (error: any) {
//     //   if (integration?._id && error?.response?.status === 401) {
//     //     integration = await refreshAccessToken(integration)

//     //     repository = await BitBucketApi.getRepository(
//     //       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     //       // @ts-ignore
//     //       integration?.metadata?.accessToken,
//     //       repositoryId,
//     //     )
//     //   } else {
//     //     throw error
//     //   }
//     // }
//   } else if (type === IntegrationTypeEnum.GITLAB) {
//     // try {
//     repository = await GitLabApi.getPublicRepository(repositoryId)
//     // } catch (error: any) {
//     //   if (integration?._id && error?.response?.status === 401) {
//     //     integration = await refreshAccessToken(integration)

//     //     repository = await GitLabApi.getRepository(
//     //       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     //       // @ts-ignore
//     //       integration?.metadata?.accessToken,
//     //       repositoryId,
//     //     )
//     //   } else {
//     //     throw error
//     //   }
//     // }
//   } else if (type === IntegrationTypeEnum.GITHUB) {
//     // let accessToken

//     // if (integration.authType === IntegrationAuthTypeEnum.GITHUB_APP) {
//     //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     //   // @ts-ignore
//     //   accessToken = await GitHubApp.getInstallationToken(integration.metadata.installationId)
//     // } else {
//     //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     //   // @ts-ignore
//     //   accessToken = integration?.metadata?.accessToken
//     // }

//     repository = await GitHubApi.getPublicRepository(repositoryId)
//   }

//   return repository
// }

// export const getPublicRepositoryTree = async (
//   gitProviderType: IntegrationTypeEnum,
//   repositoryId: string,
//   ref: string,
//   path: string,
//   page: string,
//   perPage: number,
// ) => {
//   let tree

//   if (gitProviderType === IntegrationTypeEnum.BITBUCKET) {
//     tree = await BitBucketApi.getPublicRepositoryTree(
//       repositoryId,
//       ref,
//       path,
//       page,
//       perPage,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITLAB) {
//     tree = await GitLabApi.getPublicRepositoryTree(
//       repositoryId,
//       ref,
//       path,
//       Number(page),
//       perPage,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITHUB) {
//     tree = await GitHubApi.getPublicRepositoryTree(
//       repositoryId,
//       ref,
//       path,
//       Number(page),
//       perPage,
//     )
//   }

//   return tree
// }

// export const getPublicRepositoryBranch = async (
//   gitProviderType: IntegrationTypeEnum,
//   repositoryId: string,
//   branchName: string,
// ): Promise<GitBranch> => {
//   let branch

//   if (gitProviderType === IntegrationTypeEnum.BITBUCKET) {
//     branch = await BitBucketApi.getPublicRepositoryBranch(
//       repositoryId,
//       branchName,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITLAB) {
//     branch = await GitLabApi.getPublicRepositoryBranch(
//       repositoryId,
//       branchName,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITHUB) {
//     branch = await GitHubApi.getPublicRepositoryBranch(
//       repositoryId,
//       branchName,
//     )
//   }

//   return branch
// }

// export const listPublicRepositoryBranches = async (
//   gitProviderType: IntegrationTypeEnum,
//   repositoryId: string,
//   page: number,
//   perPage: number,
// ): Promise<DataWithGitCursor<GitBranch>> => {
//   let branches

//   if (gitProviderType === IntegrationTypeEnum.BITBUCKET) {
//     branches = await BitBucketApi.listPublicRepositoryBranches(
//       repositoryId,
//       page,
//       perPage,
//     )

//   } else if (gitProviderType === IntegrationTypeEnum.GITLAB) {
//     branches = await GitLabApi.listPublicRepositoryBranches(
//       repositoryId,
//       page,
//       perPage,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITHUB) {
//     branches = await GitHubApi.listPublicRepositoryBranches(
//       repositoryId,
//       page,
//       perPage,
//     )
//   }

//   return branches
// }

// export const getPublicRepositoryFileContents = async (
//   gitProviderType: IntegrationTypeEnum,
//   repositoryId: string,
//   ref: string,
//   path: string,
// ): Promise<Stream> => {
//   let fileContent

//   if (gitProviderType === IntegrationTypeEnum.BITBUCKET) {
//     fileContent = await BitBucketApi.getPublicRepositoryFileContents(
//       repositoryId,
//       ref,
//       path,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITLAB) {
//     fileContent = await GitLabApi.getPublicRepositoryFileContents(
//       repositoryId,
//       ref,
//       path,
//     )
//   } else if (gitProviderType === IntegrationTypeEnum.GITHUB) {
//     fileContent = await GitHubApi.getPublicRepositoryFileContents(
//       repositoryId,
//       ref,
//       path,
//     )
//   }

//   return fileContent
// }
