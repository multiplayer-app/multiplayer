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
    const page = Number(req.query.page || 1)
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

    const tags = await GitProviderUtil.listTags(
      integration,
      decodeURIComponent(gitRepository.gitRepository._id),
      page,
      perPage,
    )

    return res.status(200).json(tags)
  } catch (err) {
    return next(err)
  }
}
