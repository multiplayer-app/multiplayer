import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { ProjectModel } from '@multiplayer/models'
import { ErrorMessage, IUser } from '@multiplayer/types'
import { AccessControlContext } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectUserId = req.params.projectUserId as string

    const [projectUser] = await ProjectModel.getProjectUsersByProjectUserIds(
      projectId,
      [projectUserId],
    )

    if (!projectUser) {
      throw new NotFoundError(ErrorMessage.TEAM_MEMBER_NOT_FOUND)
    }

    await ProjectModel.removeUser(projectId, projectUserId)

    const userId = ((projectUser.workspaceUser as any).user as IUser)._id

    await AccessControlContext.invalidateContext({
      workspaceId,
      userId: userId.toString(),
    })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
