import type { Request, Response, NextFunction } from 'express'
import {
  IIntegrationDocument,
  IntegrationModel,
} from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { ErrorMessage } from '@multiplayer/types'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page || 1)
    const perPage = Number(req.query.perPage || 30)
    const gitRepository = req.gitRepository
    let integration: IIntegrationDocument | { type: IntegrationTypeEnum } | undefined

    if (gitRepository.gitRepository.private) {
      integration = await IntegrationModel.findIntegrationInWorkspace(
        gitRepository?.workspace,
        gitRepository.gitRepository.type,
      )

      if (!integration) {
        throw new NotFoundError(ErrorMessage.INTEGRATION_NOT_FOUND)
      }
    } else {
      integration = { type: gitRepository.gitRepository.type }
    }

    const branches = await GitProviderUtil.listBranches(
      integration,
      decodeURIComponent(gitRepository.gitRepository._id),
      page,
      perPage,
    )

    return res.status(200).json(branches)
  } catch (err) {
    return next(err)
  }
}
