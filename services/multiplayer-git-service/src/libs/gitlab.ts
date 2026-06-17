import fetch from './fetch'
import { mongoose } from '@multiplayer/mongo'
import {
  GitContentType,
  GitRepositoryOwnerType,
} from '@multiplayer/types'
import {
  GIT_GITLAB_APP_ID,
  GIT_GITLAB_APP_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
  GIT_GITLAB_ACCESS_TOKEN,
} from '../config'
import { Stream } from 'stream'
import { CommitContent } from '../types'

const getRepositoryOwnerType = (type: string) => {
  if (type === 'user') {
    return GitRepositoryOwnerType.USER
  }
  if (type === 'group') {
    return GitRepositoryOwnerType.ORGANIZATION
  }

  return ''
}

const getContentType = (type: string) => {
  if (type === 'blob') {
    return GitContentType.FILE
  }
  if (type === 'tree') {
    return GitContentType.DIRECTORY
  }

  return ''
}

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string, refreshToken: string }> => {
  const response = await fetch(
    'https://gitlab.com/oauth/token',
    {
      method: 'POST',
      data: {
        client_id: GIT_GITLAB_APP_ID,
        client_secret: GIT_GITLAB_APP_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        redirect_uri: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/integrations/gitlab/callback`,
      },
    },
  )

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  }
}

export const listRepositories = async (
  page: number,
  perPage: number,
  repositoryName?: string,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${GIT_GITLAB_ACCESS_TOKEN}`
  }

  let response

  if (accessToken) {
    response = await fetch(
      'https://gitlab.com/api/v4/projects',
      {
        headers,
        params: {
          membership: true,
          per_page: perPage,
          page: page,
        },
      },
    )
  } else {
    response = await fetch(
      'https://gitlab.com/search',
      {
        headers,
        params: {
          ...repositoryName
            ? { search: encodeURIComponent(repositoryName) }
            : {},
          scope: 'projects',
          per_page: perPage,
          page: page,
        },
      },
    )
  }

  const repositories = response.data.map((repository) => ({
    _id: String(repository.id),
    id: String(repository.id),
    name: repository.name,
    fullName: repository.path_with_namespace,
    private: repository.visibility === 'private',
    defaultBranch: repository.default_branch,
    owner: {
      kind: getRepositoryOwnerType(repository.namespace.kind),
      name: repository.namespace.name,
    },
    url: repository.web_url,
  }))

  let nextPage
  if (response.data?.length < perPage) {
    nextPage = page + 1
  }

  return {
    data: repositories,
    cursor: {
      page,
      perPage,
      nextPage,
    },
  }
}

export const getRepository = async (
  repositoryId: string,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${GIT_GITLAB_ACCESS_TOKEN}`
  }

  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}`,
    {
      headers,
    },
  )

  const repository = {
    _id: String(response.data.id),
    id: String(response.data.id),
    name: response.data.name,
    fullName: response.data.path_with_namespace,
    private: response.data.visibility === 'private',
    defaultBranch: response.data.default_branch,
    owner: {
      kind: getRepositoryOwnerType(response.data.namespace.kind),
      name: response.data.namespace.name,
    },
    url: response.data.web_url,
  }

  return repository
}

export const listBranches = async (
  repositoryId: string,
  page: number,
  perPage: number,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${GIT_GITLAB_ACCESS_TOKEN}`
  }

  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}/repository/branches`,
    {
      headers,
      params: {
        per_page: perPage,
        page: page,
      },
    },
  )

  const branches = response.data.map((branch) => ({
    _id: branch.name,
    id: branch.name,
    name: branch.name,
    lastCommitSha: branch.commit.id,
    default: branch.default,
  }))

  let nextPage
  if (response.data?.length < perPage) {
    nextPage = page + 1
  }

  return {
    data: branches,
    cursor: {
      page,
      perPage,
      nextPage,
    },
  }
}

export const listTags = async (
  repositoryId: string,
  page: number,
  perPage: number,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${GIT_GITLAB_ACCESS_TOKEN}`
  }

  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}/repository/tags`,
    {
      headers,
      params: {
        per_page: perPage,
        page: page,
      },
    },
  )

  const tags = response.data.map((tag) => ({
    _id: tag.name,
    id: tag.name,
    name: tag.name,
    message: tag.message,
    commitSha: tag.commit.id,
  }))

  let nextPage
  if (response.data?.length < perPage) {
    nextPage = page + 1
  }

  return {
    data: tags,
    cursor: {
      page,
      perPage,
      nextPage,
    },
  }
}

export const getBranch = async (
  repositoryId: string,
  branchName: string,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${GIT_GITLAB_ACCESS_TOKEN}`
  }

  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}/repository/branches/${branchName}`,
    {
      headers,
    },
  )

  const branch = {
    _id: response.data.name,
    id: response.data.name,
    name: response.data.name,
    lastCommitSha: response.data.commit.id,
    default: response.data.default,
  }

  return branch
}

export const getRepositoryTree = async (
  repositoryId: string,
  ref: string,
  path: string,
  page: number,
  perPage: number,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${GIT_GITLAB_ACCESS_TOKEN}`
  }

  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}/repository/tree`,
    {
      params: {
        ref,
        path,
        per_page: perPage,
        page,
      },
      headers,
    },
  )

  const repoContents = response.data.map((content) => ({
    _id: encodeURIComponent(content.path),
    id: content.id,
    sha: content.sha,
    name: content.name,
    path: content.path,
    type: getContentType(content.type),
  }))

  let nextPage
  if (response.data?.length < perPage) {
    nextPage = page + 1
  }

  return {
    data: repoContents,
    cursor: {
      page,
      perPage,
      nextPage,
    },
  }
}

export const getFileContents = async (
  repositoryId: string,
  ref: string,
  path: string,
  accessToken?: string,
): Promise<Stream> => {
  const headers: any = {
    Accept: 'application/vnd.github.raw',
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${GIT_GITLAB_ACCESS_TOKEN}`
  }

  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}/repository/files/${encodeURIComponent(path)}/raw`,
    {
      params: {
        ref,
      },
      headers,
      responseType: 'stream',
    },
  )

  return response.data
}

export const createBranch = async (
  repositoryId: string,
  branchName: string,
  sha: string,
  accessToken: string,
) => {
  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}/repository/branches`,
    {
      method: 'POST',
      params: {
        branch: branchName,
        ref: sha,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  const branch = {
    _id: response.data.name,
    id: response.data.name,
    name: response.data.name,
    lastCommitSha: response.data.commit.id,
    default: response.data.default,
  }

  return branch
}

export const createCommit = async (
  repositoryId: string,
  branchName: string,
  commitMessage: string,
  contents: CommitContent[],
  accessToken: string,
) => {
  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}/repository/commits`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        branch: branchName,
        commit_message: commitMessage,
        actions: contents.map(content => ({
          action: content.action,
          file_path: content.filePath,
          previous_path: content.previousPath,
          content: content.content,
        })),
      },
    },
  )

  const commit = response.data

  return commit
}

export const createWebhook = async (
  repositoryId: string,
  url: string,
  accessToken: string,
): Promise<{ url: string, id: string }> => {
  try {
    const webhookPayload = {
      id: new mongoose.Types.ObjectId().toString(),
      url,
      push_events: true,
    }

    const { data } = await fetch(
      `https://gitlab.com/api/v4/projects/${repositoryId}/hooks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: webhookPayload,
      },
    )

    const webhook = {
      id: data.id,
      url: data.url,
    }

    return webhook
  } catch (error: any) {
    if (error?.response?.data) {
      throw error?.response?.data
    }

    throw error
  }
}

export const getWebhooks = async (
  repositoryId: string,
  accessToken: string,
): Promise<{ url: string, id: string }[]> => {
  try {
    const { data } = await fetch(
      `https://gitlab.com/api/v4/projects/${repositoryId}/hooks`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const webhooks = data.map(({ id, url }) => ({
      id,
      url,
    }))

    return webhooks
  } catch (error: any) {
    if (error?.response?.data) {
      throw error?.response?.data
    }

    throw error
  }
}

export const deleteWebhook = async (
  repositoryId: string,
  webhookId: string,
  accessToken: string,
): Promise<void> => {
  try {
    await fetch(
      `https://gitlab.com/api/v4/projects/${repositoryId}/hooks/${webhookId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  } catch (error: any) {
    if (error?.response?.data) {
      throw error?.response?.data
    }

    throw error
  }
}

export const getCommit = async (
  repositoryId: string,
  commitSha: string,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else {
    headers.Authorization = `Bearer ${GIT_GITLAB_ACCESS_TOKEN}`
  }

  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${repositoryId}/repository/commits/${commitSha}/diff`,
    {
      headers,
    },
  )

  const commit = response.data

  return commit
}

export const createPullRequest = async (
  repositoryId: string,
  branchName: string,
  baseBranch: string | undefined,
  title: string,
  description: string | undefined,
  accessToken?: string,
): Promise<string> => {
  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${encodeURIComponent(repositoryId)}/merge_requests`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        title,
        description,
        source_branch: branchName,
        target_branch: baseBranch,
      },
    },
  )

  return response.data.web_url
}
