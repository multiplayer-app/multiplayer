import type { Request, Response, NextFunction } from 'express'
import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { GitProviderUtil } from '../../util'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const {
      name,
      parentBranch: parentBranchId,
    } = req.body
    const gitRepository = req.gitRepository

    let integration: IIntegrationDocument | undefined

    if (gitRepository.gitRepository.private) {
      integration = await IntegrationModel.findIntegrationInWorkspace(
        workspaceId,
        gitRepository.gitRepository.type,
      )

      if (!integration) {
        throw new NotFoundError(ErrorMessage.INTEGRATION_NOT_FOUND)
      }
    } else {
      throw new NotFoundError(ErrorMessage.CANNOT_EDIT_PUBLIC_REPO)
    }

    const parentBranch = await GitProviderUtil.getBranch(
      integration as IIntegrationDocument,
      decodeURIComponent(gitRepository.gitRepository._id),
      parentBranchId,
    )

    const { lastCommitSha } = parentBranch

    const newBranch = await GitProviderUtil.createBranch(
      integration as IIntegrationDocument,
      decodeURIComponent(gitRepository.gitRepository._id),
      name,
      lastCommitSha,
    )

    return res.status(200).json(newBranch)
  } catch (err) {
    return next(err)
  }
}
