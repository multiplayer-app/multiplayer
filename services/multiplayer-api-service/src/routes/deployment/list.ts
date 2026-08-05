import type { Request, Response, NextFunction } from 'express'
import { DeploymentModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = req.query.sortDirection
      ? Number(req.query.sortDirection) as -1 | 1
      : -1
    const sortKey = req.query.sortKey
      ? req.query.sortKey as string
      : '_id'
    const entity = req.query.entity as string | undefined
    const environment = req.query.environment as string | undefined

    const filter: {
      workspace: string,
      project: string,
      entity?: string,
      environment?: string
    } = {
      workspace: workspaceId,
      project: projectId,
      entity,
      environment,
    }

    const deployments = await DeploymentModel.findDeployments(
      filter,
      {
        skip,
        limit,
      },
      {
        sortKey,
        sortDirection,
      },
    )

    return res.status(200).json(deployments)
  } catch (err) {
    return next(err)
  }
}
