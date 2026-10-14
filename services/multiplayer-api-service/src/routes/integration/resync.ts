import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  GitRepositoryModel,
  IntegrationModel,
} from '@multiplayer/models'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const integration = req.integration

    const gitRepositories = await GitRepositoryModel.findGitRepositories({
      workspace: workspaceId,
      gitRepositoryType: integration.type,
    })

    await Promise.all(gitRepositories.data.map(async gitRepository => {
      const gitRepo = await GitProviderUtil.getRepository(
        integration,
        gitRepository.gitRepository.id,
      )

      await GitRepositoryModel.updateGitRepositoriesByGitId(
        gitRepo.id,
        {
          'gitRepository.owner': gitRepo.owner.name,
          'gitRepository.name': gitRepo.name,
          'gitRepository.url': gitRepo.url,
          'gitRepository.defaultBranch': gitRepo.defaultBranch,
        },
      )
    }))

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
