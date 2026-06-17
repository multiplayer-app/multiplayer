import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'
import { AccessControlContext } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const payload = req.body

    const project = await ProjectModel.updateProjectById(projectId, payload)

    await AccessControlContext.invalidateContext({ workspaceId })

    return res.status(200).json(project)
  } catch (err) {
    return next(err)
  }
}
