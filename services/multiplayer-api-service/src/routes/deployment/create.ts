import type { Request, Response, NextFunction } from 'express'
import { DeploymentModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const payload = req.body

    const deployment = await DeploymentModel.createDeployment({
      workspace: workspaceId,
      project: projectId,
      ...payload,
    })

    return res.status(200).json(deployment)
  } catch (err) {
    return next(err)
  }
}
