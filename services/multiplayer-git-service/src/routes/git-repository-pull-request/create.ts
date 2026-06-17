import type { Request, Response, NextFunction } from 'express'
import { IntegrationModel } from '@multiplayer/models'
import {
  IntegrationTypeEnum,
  ErrorMessage,
} from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { GitProviderUtil } from '../../util'
import { GitRepositoryLib } from '../../libs'

const detectPlatform = (repositoryUrl: string): IntegrationTypeEnum.GITHUB | IntegrationTypeEnum.GITLAB | IntegrationTypeEnum.BITBUCKET | null => {
  if (!repositoryUrl?.includes) {
    return null
  }
  if (repositoryUrl.includes('github.com')) {
    return IntegrationTypeEnum.GITHUB
  }
  if (repositoryUrl.includes('gitlab.com') || /gitlab\.[a-z]/.test(repositoryUrl)) {
    return IntegrationTypeEnum.GITLAB
  }
  if (repositoryUrl.includes('bitbucket.org')) {
    return IntegrationTypeEnum.BITBUCKET
  }
  return null
}

const parseRepoPath = (repositoryUrl: string): string | null => {
  const match = repositoryUrl.match(/(?:github\.com|gitlab\.com|bitbucket\.org)[/:](.+?)(?:\.git)?$/)
  return match?.[1] ?? null
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      repositoryUrl,
      branchName,
      baseBranch,
      title,
      description,
    } = req.body

    const platform = detectPlatform(repositoryUrl)
    if (!platform) {
      throw new Error('Unsupported platform. Supported: GitHub, GitLab, Bitbucket.')
    }

    const repoPath = parseRepoPath(repositoryUrl)
    if (!repoPath) {
      throw new Error('Could not parse repository path from URL.')
    }
    const [owner, name] = repoPath.split('/')

    const integration = await IntegrationModel.findIntegrationInWorkspace(workspaceId, platform)
    if (!integration) {
      throw new NotFoundError(ErrorMessage.INTEGRATION_NOT_FOUND)
    }

    const gitRepository = await GitRepositoryLib.findGitRepositoryByName(
      workspaceId,
      projectId,
      platform,
      owner,
      name,
    )

    const prUrl = await GitProviderUtil.createPullRequest(
      integration,
      decodeURIComponent(gitRepository.gitRepository._id),
      branchName,
      baseBranch,
      title,
      description,
    )

    const data = {
      prUrl,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
