import type { Request, Response, NextFunction } from 'express'
import { DeploymentModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deploymentId = req.params.deploymentId as string

    const deployment = await DeploymentModel.findDeploymentById(deploymentId)

    return res.status(200).json(deployment)
  } catch (err) {
    return next(err)
  }
}
