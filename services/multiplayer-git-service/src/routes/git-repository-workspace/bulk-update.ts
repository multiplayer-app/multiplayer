import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  IntegrationModel,
} from '@multiplayer/models'
import { GitProviderUtil } from '../../util'
import { GitRepositoryLib } from '../../libs'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const {
      gitRepositoryId,
      gitRepositoryType,
      archived,
      projects,
    } = req.body

    const integration = await IntegrationModel.findIntegrationInWorkspace(
      workspaceId,
      gitRepositoryType,
    )

    if (!integration) {
      throw new NotFoundError(ErrorMessage.INTEGRATION_NOT_FOUND)
    }

    const gitRepo = await GitProviderUtil.getRepository(
      integration,
      decodeURIComponent(gitRepositoryId),
    )

    const { data: updatedGitRepositories } = await GitRepositoryLib.bulkUpdateGitRepositoryAccess({
      workspaceId,
      gitRepo,
      projects,
      archived,
      integration,
    })

    return res.status(200).json(updatedGitRepositories)
  } catch (err) {
    return next(err)
  }
}
