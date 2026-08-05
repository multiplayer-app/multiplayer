import {
  GitContentType,
  GitRepositoryOwnerType,
} from '@multiplayer/types'
import fetch from './fetch'
import {
  GIT_BITBUCKET_CLIENT_ID,
  GIT_BITBUCKET_CLIENT_SECRET,
} from '../config'
import {
  CommitContent,
  CommitContentActionEnum,
} from '../types'

const getRepositoryOwnerType = (type: string) => {
  if (type === 'user') {
    return GitRepositoryOwnerType.USER
  }
  // if (type === 'group') {
  return GitRepositoryOwnerType.ORGANIZATION
  // }
}

const getContentType = (type: string) => {
  if (type === 'commit_file') {
    return GitContentType.FILE
  }
  if (type === 'commit_directory') {
    return GitContentType.DIRECTORY
  }

  return ''
}

export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> => {
  const response = await fetch({
    url: 'https://bitbucket.org/site/oauth2/access_token',
    headers: {
      'Cache-Control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded',
    },
    auth: {
      username: GIT_BITBUCKET_CLIENT_ID,
      password: GIT_BITBUCKET_CLIENT_SECRET,
    },
    method: 'POST',
    data: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  })

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
  }

  const response = await fetch(
    'https://api.bitbucket.org/2.0/repositories',
    {
      params: {
        pagelen: perPage,
        page,
        ...repositoryName
          ? { q: encodeURIComponent(repositoryName) }
          : {},
        ...accessToken
          ? { role: 'member' }
          : {},
      },
      headers,
    },
  )

  const repositories = response.data.values.map((repository) => ({
    id: repository.uuid,
    _id: `${repository.workspace.uuid}/${repository.uuid}`,
    name: repository.name,
    fullName: repository.full_name,
    private: repository.is_private,
    defaultBranch: repository.mainbranch.name,
    owner: {
      kind: getRepositoryOwnerType(repository.owner.type),
      name: repository.owner.nickname,
    },
    url: repository.links.html.href,
  }))

  let nextPage
  if (response?.data?.next) {
    nextPage = response.data.next.match(/page=([^&]+)/)[1]
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
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}`,
    {
      method: 'GET',
      headers,
    },
  )
  const repository = {
    id: response.data.uuid,
    _id: `${response.data.workspace.uuid}/${response.data.uuid}`,
    name: response.data.name,
    fullName: response.data.full_name,
    private: response.data.is_private,
    defaultBranch: response.data.mainbranch.name,
    owner: {
      kind: getRepositoryOwnerType(response.data.owner.type),
      name: response?.data?.owner?.nickname
        || response?.data?.owner?.username
        || response?.data?.owner?.display_name,
    },
    url: response.data.links.html.href,
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
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/refs/branches`,
    {
      headers,
      params: {
        pagelen: perPage,
        page,
      },
    },
  )

  const branches = response.data.values.map((branch) => ({
    _id: branch.name,
    id: branch.name,
    name: branch.name,
    lastCommitSha: branch.target.hash,
  }))

  let nextPage
  if (response?.data?.next) {
    nextPage = response.data.next.match(/page=([^&]+)/)[1]
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
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/refs/tags`,
    {
      headers,
      params: {
        // pagelen: perPage,
        // page,
      },
    },
  )

  const tags = response.data.values.map((tag) => ({
    _id: tag.tag,
    id: tag.tag,
    name: tag.name,
    message: tag.message,
    commitSha: tag.target.hash,
  }))

  let nextPage
  if (response?.data?.next) {
    nextPage = response.data.next.match(/page=([^&]+)/)[1]
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

export const getRepositoryTree = async (
  repositoryId: string,
  ref: string,
  path: string,
  page: string,
  perPage: number,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/src/${ref}/${encodeURIComponent(path)}`,
    {
      headers,
      params: {
        pagelen: perPage,
        ...page === '1' ? {} : { page: page },
      },
    },
  )

  const repoContents = response.data.values.map((content) => ({
    _id: encodeURIComponent(content.path),
    id: encodeURIComponent(content.path),
    sha: content.commit.hash,
    name: content.path.split('/').slice(-1)[0],
    path: content.path,
    type: getContentType(content.type),
  }))

  let nextPage
  if (response?.data?.next) {
    nextPage = response.data.next.match(/page=([^&]+)/)[1]
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
) => {
  const headers: any = {
    Accept: 'application/vnd.github.raw',
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/src/${ref}/${encodeURIComponent(path)}`,
    {
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
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/refs/branches`,
    {
      method: 'POST',
      headers,
      data: {
        name: branchName,
        target: {
          hash: sha,
        },
      },
    },
  )
  const branch = {
    _id: response.data.name,
    id: response.data.name,
    name: response.data.name,
    lastCommitSha: response.data.target.hash,
  }
  return branch
}

export const getBranch = async (
  repositoryId: string,
  branchName: string,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/refs/branches/${branchName}`,
    {
      method: 'GET',
      headers,
    },
  )
  const branch = {
    _id: response.data.name,
    id: response.data.name,
    name: response.data.name,
    lastCommitSha: response.data.target.hash,
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
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const payload = new URLSearchParams({
    message: commitMessage,
  })

  contents.forEach(content => {
    payload.append(
      content.filePath,
      content.action !== CommitContentActionEnum.DELETE && content.content
        ? content.content
        : '',
    )
  })

  await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/src`,
    {
      params: {
        branch: branchName,
      },
      method: 'POST',
      headers,
      data: payload,
    },
  )

  const commit = await getLastCommit(
    accessToken,
    repositoryId,
    branchName,
  )

  return commit
}

export const createWebhook = async (
  repositoryId: string,
  url: string,
  accessToken: string,
): Promise<{ url: string, id: string }> => {

  const webhookPayload = {
    description: 'Multiplayer Webhook',
    url,
    active: true,
    events: [
      'repo:push',
      'repo:updated',
    ],
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/hooks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: webhookPayload,
    },
  )

  const webhook = {
    id: response.data.uuid,
    url: response.data.url,
  }
  return webhook
}

export const getWebhooks = async (
  repositoryId: string,
  accessToken: string,
): Promise<{ url: string, id: string }[]> => {
  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/hooks`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
  const webhooks = response.data.values.map(webhook => ({
    url: webhook.url,
    id: webhook.uuid,
  }))

  return webhooks
}

export const deleteWebhook = async (
  repositoryId: string,
  webhookId: string,
  accessToken: string,
): Promise<void> => {
  await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/hooks/${webhookId}`,
    {
      method: 'DELET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
}

export const getCommit = async (
  repositoryId: string,
  commitHash: string,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/diffstat/${commitHash}`,
    {
      method: 'GET',
      headers,
    },
  )
  const commit = response.data

  return commit
}

export const getLastCommit = async (
  repositoryId: string,
  branchName: string,
  accessToken?: string,
) => {
  const headers: any = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/commits/${branchName}`,
    {
      method: 'GET',
      headers,
    },
  )
  const commit = {
    sha: response.data?.values[0].hash,
  }

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
    `https://api.bitbucket.org/2.0/repositories/${repositoryId}/pullrequests`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        title,
        description,
        source: { branch: { name: branchName } },
        destination: { branch: { name: baseBranch } },
      },
    },
  )

  return response.data.links.html.href
}
