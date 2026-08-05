import type { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import {
  TokenModel,
  IUserDocument,
  IWorkspaceDocument,
} from '@multiplayer/models'
import { ErrorMessage, TokenTypeEnum } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { isFreeEmail } from '@multiplayer/util-shared'
import { NotificationLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as IUserDocument
    const workspace = req.workspace as IWorkspaceDocument
    const { domain, email } = req.body

    const emailDomain = email.split('@')[1]

    if (emailDomain !== domain) {
      throw new InvalidArgumentError(ErrorMessage.EMAIL_DOMAIN_NOT_MATCH_VERIFIED)
    }

    if (isFreeEmail(email)) {
      throw new InvalidArgumentError(ErrorMessage.FREE_EMAIL_DOMAIN_NOT_SUPPORTED)
    }

    await TokenModel.deleteAllTokensForWorkspace(
      workspace._id,
      TokenTypeEnum.VERIFY_DOMAIN,
      domain,
    )

    const token = await TokenModel.createToken(
      TokenTypeEnum.VERIFY_DOMAIN,
      user?._id,
      {
        meta: {
          domain,
          workspace: workspace._id,
        },
      },
    )

    NotificationLib.sendNotification({
      template: 'VERIFY_DOMAIN',
      email,
      data: {
        code: token.token,
        workspace,
      },
    }).catch(err => logger.error(err, 'Failed to send VERIFY_DOMAIN notification'))

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
