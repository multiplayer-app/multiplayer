import type { Request, Response, NextFunction } from 'express'
import {
  NotFoundError,
  InvalidArgumentError,
} from 'restify-errors'
import {
  GitRepositoryModel,
  IntegrationModel,
  IGitRepositoryDocument,
} from '@multiplayer/models'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { GitProviderUtil } from '../../util'
import { ErrorMessage } from '@multiplayer/types'

const gitProviderTypesMapping = {
  'github.com': IntegrationTypeEnum.GITHUB,
  'gitlab.com': IntegrationTypeEnum.GITLAB,
  'bitbucket.org': IntegrationTypeEnum.BITBUCKET,
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      archived,
      gitRepositoryType,
      gitRepositoryId,
      url,
    } = req.body

    let gitRepository: IGitRepositoryDocument

    if (url) {
      const [,gitProviderDomain, gitRepositoryIdUnencoded] = /:\/\/([^/]+)\/([^/]+\/[^/]+).*/.exec(url) as string[]
      const gitProviderType = gitProviderTypesMapping[gitProviderDomain] as IntegrationTypeEnum

      if (!gitProviderType) {
        throw new InvalidArgumentError('Unsupported link')
      }

      const castedGitRepositoryId = IntegrationTypeEnum.GITLAB === gitProviderType
        ? encodeURIComponent(gitRepositoryIdUnencoded)
        : gitRepositoryIdUnencoded

      const gitRepo = await GitProviderUtil.getRepository(
        { type: gitProviderType },
        castedGitRepositoryId,
      )

      const payload = {
        workspace: workspaceId,
        project: projectId,
        archived,
        gitRepository: {
          _id: gitRepo._id,
          id: gitRepo.id,
          type: gitProviderType,
          name: gitRepo.name,
          owner: gitRepo.owner.name || gitRepositoryIdUnencoded.split('/')[0],
          defaultBranch: gitRepo.defaultBranch,
          private: gitRepo.private,
          url: gitRepo.url,
        },
      }
      gitRepository = await GitRepositoryModel.createGitRepository(payload)
    } else {
      const integration = await IntegrationModel.findIntegrationInWorkspace(
        workspaceId,
        gitRepositoryType,
      )

      if (!integration) {
        return next(new NotFoundError(ErrorMessage.INTEGRATION_NOT_FOUND))
      }

      const gitRepo = await GitProviderUtil.getRepository(
        integration,
        decodeURIComponent(gitRepositoryId),
      )

      const payload = {
        workspace: workspaceId,
        project: projectId,
        archived,
        gitRepository: {
          _id: gitRepo._id,
          id: gitRepo.id,
          type: gitRepositoryType,
          name: gitRepo.name,
          owner: gitRepo.owner.name,
          defaultBranch: gitRepo.defaultBranch,
          private: gitRepo.private,
          url: gitRepo.url,
        },
      }

      gitRepository = await GitRepositoryModel.createGitRepository(payload)

      await GitProviderUtil.upsertWebhook(
        integration,
        gitRepository.gitRepository._id,
      )
    }

    return res.status(200).json(gitRepository)
  } catch (err) {
    return next(err)
  }
}
