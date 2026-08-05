import type { Request, Response, NextFunction } from 'express'
import { IUserDocument, UserModel } from '@multiplayer/models'
import { NotFoundError, InvalidArgumentError } from 'restify-errors'
import { WorkspaceService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let user = req.user as IUserDocument

    if (req.isInternal) {
      const { userId } = req.body
      user = await UserModel.findUserById(userId) as IUserDocument
      if (!user) {
        throw new NotFoundError('User not found')
      }
    } else if (req.body.userId) {
      throw new InvalidArgumentError('Not allowed to specify userId')
    }

    const { billing, ...payload } = req.body

    const workspace = await WorkspaceService.createWorkspaceForUser(user, payload, billing)

    return res.status(200).json(workspace)
  } catch (err) {
    return next(err)
  }
}
