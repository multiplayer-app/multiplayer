import type { Request, Response, NextFunction } from 'express'
import {
  TokenModel,
  UserModel,
  ITokenDocument,
  WorkspaceUserModel,
} from '@multiplayer/models'
import {
  NotFoundError,
  InvalidArgumentError,
} from 'restify-errors'
import { AccessControlContext } from '@multiplayer/auth'
import {
  TokenTypeEnum,
  WorkspaceUserStatus,
} from '@multiplayer/types'

const activateUser = async (
  currentUserId: string,
  token: ITokenDocument,
): Promise<any> => {
  await UserModel.updateUserById(
    currentUserId,
    {
      enabled: true,
    },
  )

  return {}
}

const acceptWorkspaceInvitation = async (
  currentUserId: string,
  token: ITokenDocument,
): Promise<any> => {
  const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
    currentUserId,
    token.meta.workspace as string,
  )

  if (
    !workspaceUser
    || workspaceUser.status !== WorkspaceUserStatus.PENDING
    || !token?.meta?.workspaceUser
    || !workspaceUser._id.equals(token.meta.workspaceUser)
  ) {
    throw new InvalidArgumentError('Invalid token')
  }

  await WorkspaceUserModel.updateWorkspaceUser(
    workspaceUser.user,
    workspaceUser.workspace,
    {
      status: WorkspaceUserStatus.ACTIVE,
    },
  )

  await TokenModel.deleteAllTokensForUser(
    currentUserId,
    TokenTypeEnum.USER_WORKSPACE_INVITATION,
    {
      workspace: token.meta.workspace as string,
    },
  )

  await AccessControlContext.invalidateContext({
    workspaceId: workspaceUser.workspace.toString(),
    userId: workspaceUser.user.toString(),
  })

  return {
    workspace: workspaceUser.workspace,
  }
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = String(req.session?.current)
    const { token: tokenCode } = req.body

    const token = await TokenModel.findByToken(tokenCode)

    if (!token) {
      throw new NotFoundError('Token not found.')
    }

    let response = {}

    switch (token.type) {
      case TokenTypeEnum.USER_INVITE:
        response = await activateUser(currentUserId, token)
        break
      case TokenTypeEnum.USER_WORKSPACE_INVITATION:
        response = await acceptWorkspaceInvitation(
          currentUserId,
          token,
        )
        break
      default:
        throw new InvalidArgumentError('Unknown token type.')
    }

    return res.status(200).json(response)
  } catch (err) {
    return next(err)
  }
}
