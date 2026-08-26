import type { Request, Response, NextFunction } from 'express'
import {
  IIntegrationDocument,
  IntegrationModel,
} from '@multiplayer/models'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { GitProviderUtil } from '../../util'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const path = req.params.path as string
    const ref = req.query.ref as string
    const page = String(req.query.page || '1')
    const perPage = Number(req.query.perPage || 30)
    const gitRepository = req.gitRepository
    let integration: IIntegrationDocument | { type: IntegrationTypeEnum } | undefined

    if (gitRepository.gitRepository.private) {
      integration = await IntegrationModel.findIntegrationInWorkspace(
        workspaceId,
        gitRepository.gitRepository.type,
      )

      if (!integration) {
        throw new NotFoundError(ErrorMessage.INTEGRATION_NOT_FOUND)
      }
    } else {
      integration = { type: gitRepository.gitRepository.type }
    }

    const tree = await GitProviderUtil.getRepositoryTree(
      integration,
      decodeURIComponent(gitRepository.gitRepository._id),
      ref,
      decodeURIComponent(path),
      page,
      perPage,
    )

    return res.status(200).json(tree)
  } catch (err) {
    return next(err)
  }
}
