import type { Request, Response, NextFunction } from 'express'
import { EnvironmentModel } from '@multiplayer/models'
import { Types } from 'mongoose'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentEnvironment = req.environment
    const lastCommit = req.lastCommit
    const projectBranchId = req.params.projectBranchId as string
    const environmentId = req.params.environmentId as string

    if ((currentEnvironment.projectBranch as Types.ObjectId).equals(projectBranchId)) {
      await EnvironmentModel.deleteEnvironment(
        environmentId,
        projectBranchId,
      )
    } else {
      const {
        _id,
        ...payload
      } = currentEnvironment.toJSON()

      await EnvironmentModel.createEnvironment({
        ...payload,
        projectBranch: projectBranchId,
        deletedAtCommit: lastCommit._id.toString(),
      })
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
