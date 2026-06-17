import type { Request, Response, NextFunction } from 'express'
import {
  TeamModel,
  ProjectModel,
} from '@multiplayer/models'
import { RoleType } from '@multiplayer/types'
import { AccessControlContext } from '@multiplayer/auth'
import { RoleLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      workspaceUserId,
      userId,
    } = req.context
    const workspaceId = req.params.workspaceId as string
    const payload = req.body

    const team = await TeamModel.createTeam({
      ...payload,
      workspace: workspaceId,
    })

    const teamsInWorkspace = await TeamModel.countTeamsInWorkspace(workspaceId)

    if (teamsInWorkspace === 1) {
      const projectIds = await ProjectModel.getProjectIdsInWorkspace(workspaceId)

      await TeamModel.addProject(
        team._id,
        projectIds.map(({ _id }) => _id),
      )
    }

    const projectRole = await RoleLib.fetchDefaultRole(RoleType.PROJECT)
    await TeamModel.addUsers(
      team._id,
      [workspaceUserId as string],
      projectRole._id,
    )

    await AccessControlContext.invalidateContext({
      workspaceId,
      userId: userId as string,
    })

    return res.status(200).json(team)
  } catch (err) {
    return next(err)
  }
}
