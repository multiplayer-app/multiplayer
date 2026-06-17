import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'
import { AccessControlContext } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const teamId = req.params.teamId as string
    const { project } = req.body

    await TeamModel.removeProject(teamId, project)

    await AccessControlContext.invalidateContext({ workspaceId })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
