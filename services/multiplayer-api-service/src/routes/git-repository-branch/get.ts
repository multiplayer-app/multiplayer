import { NextFunction, Request, Response } from 'express'
import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { GitProviderUtil } from '../../util'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitRepositoryId = req.params.gitRepositoryId as string
    const branchName = req.params.branchName as string
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

    const branch = await GitProviderUtil.getBranch(
      integration,
      decodeURIComponent(gitRepositoryId),
      branchName,
    )
    return res.status(200).json(branch)
  } catch (err) {
    return next(err)
  }
}
