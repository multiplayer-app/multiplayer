import passport from 'passport'
import { ForbiddenError } from 'restify-errors'
import { Request, Response, NextFunction } from 'express'
import logger from '@multiplayer/logger'
import { ErrorMessage } from '@multiplayer/types'
import { UserModel } from '@multiplayer/models'
import { EmailService } from '../../service'

export default async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { failureMessage: true }, async (err, user) => {
    try {
      if (err || !user) {
        logger.error(err)
        return next(err)
      }

      if (!user?.profiles?.local?.isEmailConfirmed) {
        throw new ForbiddenError(ErrorMessage.EMAIL_NOT_CONFIRMED)
      }

      if (!req.session.users?.find((userId) => user?._id.equals(userId))) {
        req.session.users = [
          ...(req.session.users || []),
          user?._id.toString(),
        ]
      }

      if (!user.lastLoginAt) {
        await EmailService.sendOnboardingEmails(user)
      }

      user = await UserModel.updateUserById(
        user._id,
        {
          lastLoginAt: new Date(),
        },
      )

      req.session.current = user?._id.toString()

      return res.sendStatus(204)
    } catch (err) {
      next(err)
    }
  })(req, res, next)
}
