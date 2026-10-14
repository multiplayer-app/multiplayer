import type { Request, Response, NextFunction } from 'express'
import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { GitProviderUtil } from '../../util'
import {
  CommitContent,
  CommitContentActionEnum,
} from '../../types'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const branchId = decodeURIComponent(req.params.branchId as string)
    const gitRepository = req.gitRepository
    const { commitMessage } = req.body
    const contents = req.body.contents as CommitContent[]

    contents.forEach(content => {
      content.action = CommitContentActionEnum[content.action]
    })

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

    const commit = await GitProviderUtil.createCommit(
      integration,
      decodeURIComponent(gitRepository.gitRepository._id),
      branchId,
      commitMessage,
      contents,
    )

    return res.status(200).json(commit)
  } catch (err) {
    return next(err)
  }
}
