import type { Request, Response, NextFunction } from 'express'
import {
  NotFoundError,
  ForbiddenError,
} from 'restify-errors'
import {
  TokenModel,
  WorkspaceUserModel,
  WorkspaceModel,
  ITokenDocument,
  UserModel,
} from '@multiplayer/models'
import {
  ErrorMessage,
  TokenTypeEnum,
} from '@multiplayer/types'

const getInviteWorkspaceToken = async (token: ITokenDocument) => {
  const inviterWorkspaceUser = await WorkspaceUserModel.findWorkspaceUserById(
    token?.meta?.inviterWorkspaceUser as string,
  )

  if (!inviterWorkspaceUser) {
    throw new NotFoundError(ErrorMessage.INVITER_NOT_FOUND)
  }

  const workspace = await WorkspaceModel.findWorkspaceById(
    token?.meta?.workspace as string,
  )

  if (!workspace) {
    throw new NotFoundError(ErrorMessage.WORKSPACE_NOT_FOUND)
  }

  const user = await UserModel.findUserById(token.user as string)

  if (!user) {
    throw new NotFoundError(ErrorMessage.USER_NOT_FOUND)
  }

  const tokenObject = {
    type: token.type,
    workspace: {
      _id: workspace._id,
      name: workspace.name,
    },
    email: user.primaryEmail,
    inviter: inviterWorkspaceUser.firstName && inviterWorkspaceUser.lastName
      ? `${inviterWorkspaceUser.firstName} ${inviterWorkspaceUser.lastName}`
      : inviterWorkspaceUser.username,
  }

  return tokenObject
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenCode = req.params.token as string

    const token = await TokenModel.findByToken(tokenCode as string)

    if (!token) {
      throw new NotFoundError(ErrorMessage.INVITATION_TOKEN_NOT_FOUND)
    }

    if (token.type !== TokenTypeEnum.USER_WORKSPACE_INVITATION) {
      throw new ForbiddenError()
    }

    const tokenObject = await getInviteWorkspaceToken(token)

    return res.status(200).json(tokenObject)
  } catch (err) {
    return next(err)
  }
}
