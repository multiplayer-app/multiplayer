import type { Request, Response, NextFunction } from 'express'
import { TeamModel, ProjectModel } from '@multiplayer/models'
import { AccessControlContext } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const teamId = req.params.teamId as string
    const { project: projectId } = req.body

    await TeamModel.addProject(teamId, projectId)

    const project = await ProjectModel.findProjectById(projectId)

    await AccessControlContext.invalidateContext({ workspaceId })

    return res.status(200).json(project)
  } catch (err) {
    return next(err)
  }
}
