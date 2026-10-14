import type { Request, Response, NextFunction } from 'express'
import {
  IIntegrationDocument,
  IntegrationModel,
} from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { GitProviderUtil } from '../../util'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const ref = req.query.ref as string
    const path = decodeURIComponent(
      decodeURIComponent(
        decodeURIComponent(req.params.path as string),
      ),
    )

    const fileName = path.split('/').slice(-1)[0]
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

    const fileStream = await GitProviderUtil.getFileContents(
      integration,
      decodeURIComponent(gitRepository.gitRepository._id),
      ref,
      path,
    )

    res.setHeader('Content-disposition', `attachment; filename=${fileName}`)

    fileStream.pipe(res)
  } catch (err) {
    return next(err)
  }
}
