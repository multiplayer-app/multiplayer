import type { Request, Response, NextFunction } from 'express'
import { EnvironmentModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const environmentId = req.params.environmentId as string
    const projectBranchId = req.params.projectBranchId as string

    const environment = await EnvironmentModel.getEnvironmentById(
      environmentId,
      projectBranchId,
    )

    return res.status(200).json(environment)
  } catch (err) {
    return next(err)
  }
}
