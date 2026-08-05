import fetch from './fetch'
import {
  IntegrationAuthTypeEnum,
  GitContentType,
  GitRepositoryOwnerType,
} from '@multiplayer/types'
import {
  CommitContent,
  CommitContentActionEnum,
} from '../types'

const MODES = {
  FILE: '100644',
  FOLDER: '040000',
}
const TYPE = {
  BLOB: 'blob',
  TREE: 'tree',
}

const getRepositoryOwnerType = (type: string) => {
  if (type === 'User') {
    return GitRepositoryOwnerType.USER
  }
  if (type === 'Organization') {
    return GitRepositoryOwnerType.ORGANIZATION
  }

  return ''
}

const getContentType = (type: string) => {
  if (type === 'file') {
    return GitContentType.FILE
  }
  if (type === 'dir') {
    return GitContentType.DIRECTORY
  }

  return ''
}

export const listRepositories = async (
  page: number,
  perPage: number,
  repositoryName?: string,
  appType?: IntegrationAuthTypeEnum,
  accessToken?: string,
) => {
  let response

  if (appType && accessToken) {
    response = await fetch(
      appType === IntegrationAuthTypeEnum.OAUTH
        ? 'https://api.github.com/user/repos'
        : 'https://api.github.com/installation/repositories',
      {
        params: {
          per_page: perPage,
          page,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  } else if (repositoryName) {
    response = await fetch(
      'https://api.github.com/search/repositories',
      {
        params: {
          q: encodeURIComponent(repositoryName),
          per_page: perPage,
          page,
        },
      },
    )
  } else {
    response = await fetch(
      'https://api.github.com/repositories',
      {
        params: {
          since: page,
        },
      },
    )
  }

  const repositories = (
    response.data?.repositories
      ? response.data.repositories
      : response.data
  ).map((repository) => ({
    id: String(repository.id),
    _id: encodeURIComponent(repository.full_name),
    name: repository.name,
    fullName: repository.full_name,
    private: repository.private,
    defaultBranch: repository.default_branch,
    owner: {
      kind: getRepositoryOwnerType(repository.owner.type),
      name: repository.owner.login,
    },
    url: repository.html_url,
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
  }

  const response = await fetch(
    `https://api.github.com/repos/${repositoryId}`,
    {
      headers,
    },
  )

  const repository = {
    id: String(response.data.id),
    _id: encodeURIComponent(response.data.full_name),
    name: response.data.name,
    fullName: response.data.full_name,
    private: response.data.private,
    defaultBranch: response.data.default_branch,
    owner: {
      kind: getRepositoryOwnerType(response.data.owner.type),
      name: response.data.owner.login,
    },
    url: response.data.html_url,
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
    `https://api.github.com/repos/${repositoryId}/branches`,
    {
      headers,
      params: {
        per_page: perPage,
        page,
      },
    },
  )

  const branches = response.data.map((branch) => ({
    _id: branch.name,
    id: branch.name,
    name: branch.name,
    lastCommitSha: branch.commit.sha,
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
  }

  const response = await fetch(
    `https://api.github.com/repos/${repositoryId}/tags`,
    {
      headers,
      params: {
        per_page: perPage,
        page,
      },
    },
  )

  const tags = response.data.map((tag) => ({
    _id: tag.name,
    id: tag.name,
    name: tag.name,
    message: tag.message,
    commitSha: tag.commit.sha,
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
  }

  const response = await fetch(
    `https://api.github.com/repos/${repositoryId}/branches/${branchName}`,
    {
      headers,
    },
  )

  const branch = {
    _id: response.data.name,
    id: response.data.name,
    name: response.data.name,
    lastCommitSha: response.data.commit.sha,
  }

  return branch
}

export const getRepositoryTree = async (
  repositoryId: string,
  ref: string,
  path: string,
  page: number,
  perPage: number,
  accessToken: string,
) => {
  try {
    const headers: any = {}

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(
      `https://api.github.com/repos/${repositoryId}/contents/${path}`,
      {
        params: {
          ref,
          per_page: perPage,
          page,
        },
        headers,
      },
    )

    const repoContents = response.data.map((content) => ({
      _id: encodeURIComponent(content.path),
      id: encodeURIComponent(content.path),
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
  } catch (err: any) {
    if (err?.response?.message === 'This repository is empty.') {
      return {
        data: [],
        cursor: {
          page: 0,
          perPage: 0,
          nextPage: 0,
        },
      }
    }

    throw err
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
    `https://api.github.com/repos/${repositoryId}/contents/${encodeURIComponent(path)}`,
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
  const headers: any = {
    Accept: 'application/vnd.github.raw',
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(
    `https://api.github.com/repos/${repositoryId}/git/refs`,
    {
      method: 'POST',
      headers,
      data: {
        ref: `refs/heads/${branchName}`,
        sha,
      },
    },
  )

  const branch = {
    _id: branchName,
    id: branchName,
    name: branchName,
    lastCommitSha: response.data.object.sha,
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
  const { data: { object: { sha: currentCommitSha } } } = await fetch({
    url: `https://api.github.com/repos/${repositoryId}/git/refs/heads/${branchName}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  // Get the sha of the root tree on the commit retrieved previously
  const { data: { tree: { sha: treeSha } } } = await fetch({
    url: `https://api.github.com/repos/${repositoryId}/git/commits/${currentCommitSha}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  // Create a tree to edit the content of the repository
  const { data: { sha: newTreeSha } } = await fetch({
    url: `https://api.github.com/repos/${repositoryId}/git/trees`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    data: {
      base_tree: treeSha,
      tree: contents
        .map((content) => ({
          mode: MODES.FILE,
          type: TYPE.BLOB,
          path: content.filePath,
          ...content.action === CommitContentActionEnum.DELETE
            ? { sha: null }
            : { content: content.content },
        })),
    },
  })

  // Create a commit that uses the tree created above
  const { data: { sha: newCommitSha } } = await fetch({
    url: `https://api.github.com/repos/${repositoryId}/git/commits`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    data: {
      message: commitMessage,
      tree: newTreeSha,
      parents: [currentCommitSha],
    },
  })

  // Make BRANCH_NAME point to the created commit
  const res = await fetch({
    url: `https://api.github.com/repos/${repositoryId}/git/refs/heads/${branchName}`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
    data: { sha: newCommitSha },
  })

  const commit = {
    sha: res.data?.object?.sha,
  }

  return commit

}

export const createPullRequest = async (
  repositoryId: string,
  branchName: string,
  baseBranch: string | undefined,
  title: string,
  description: string | undefined,
  accessToken: string,
): Promise<string> => {
  const response = await fetch(
    `https://api.github.com/repos/${repositoryId}/pulls`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      data: {
        title,
        body: description,
        head: branchName,
        base: baseBranch,
      },
    },
  )

  return response.data.html_url
}
