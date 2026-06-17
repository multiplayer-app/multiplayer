import type { Request, Response, NextFunction } from 'express'
import { RoleType } from '@multiplayer/types'
import {
  InvalidArgumentError,
  MethodNotAllowedError,
  NotFoundError,
} from 'restify-errors'
import {
  WorkspaceModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import { RoleLib } from '../lib'

export const validateCanInviteUserWithRoleToWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { role: roleId } = req.body

    if (roleId) {
      const role = await RoleLib.fetchRoleById(
        roleId,
        RoleType.WORKSPACE,
      )

      if (role.workspaceOwner) {
        throw new MethodNotAllowedError('Owner can\'t be invited')
      }
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

export const validateCanLeaveWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentWorkspaceUser = req.workspaceUser

    if (!currentWorkspaceUser) {
      throw new InvalidArgumentError('Invalid workspace user')
    }

    const workspace = req.workspace
    const workspaceOwnerRole = await RoleLib.fetchWorkspaceOwnerRole()

    const workspaceOwners = workspace.users.filter((user) =>
      workspaceOwnerRole._id.equals(user.role),
    )

    if (workspaceOwners.length <= 1) {
      const isCurrentUserOwner = workspaceOwners.find((workspaceMember) =>
        currentWorkspaceUser._id.equals(workspaceMember._id),
      )

      if (isCurrentUserOwner) {
        throw new MethodNotAllowedError('Owner can\'t leave workspace')
      }
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

export const validateCanChangeUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const workspaceMemberId = req.params.workspaceMemberId as string
    const newRoleId = req.body.role

    const workspaceOwnerRole = await RoleLib.fetchWorkspaceOwnerRole()
    const role = await RoleLib.fetchRoleById(newRoleId, RoleType.WORKSPACE)

    if (role.workspaceOwner) {
      throw new InvalidArgumentError('Invalid role')
    }

    const workspace = await WorkspaceModel.findWorkspaceWithWorkspaceMemberAndRole(
      workspaceId,
      workspaceMemberId,
      workspaceOwnerRole._id,
    )


    if (workspace) {
      throw new MethodNotAllowedError('Not allowed to change workspace owner role')
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

export const validateCanRemoveUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspace = req.workspace
    const account = req.account
    const workspaceMemberId = req.params.workspaceMemberId as string

    const workspaceMember = workspace.users.find((workspaceMember) =>
      workspaceMember._id.toString() === workspaceMemberId,
    )

    if (!workspaceMember) {
      throw new NotFoundError('Invalid workspace member')
    }

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUserById(
      workspaceMember.workspaceUser as string,
    )

    if (account.owner.toString() === workspaceUser?.user.toString()) {
      throw new MethodNotAllowedError('Not allowed to remove account owner from workspace')
    }

    return next()
  } catch (err) {
    return next(err)
  }
}
