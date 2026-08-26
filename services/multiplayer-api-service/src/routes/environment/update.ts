import type { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import {
  EnvironmentModel,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastCommit = req.lastCommit
    const environmentBeforeUpdate = req.environment
    const environmentId = req.params.environmentId as string
    const projectBranchId = req.params.projectBranchId as string
    const { archived, ..._payload } = req.body

    if (typeof archived === 'boolean') {
      if (archived) {
        _payload.archivedAtCommit = lastCommit._id.toString()
      } else {
        _payload.archivedAtCommit = null
        _payload.archived = false
      }
    }

    let environment

    if ((environmentBeforeUpdate.projectBranch as Types.ObjectId).equals(projectBranchId)) {
      environment = await EnvironmentModel.updateEnvironmentById(
        environmentId,
        projectBranchId,
        _payload,
      )
    } else {
      const {
        _id,
        ..._environmentObject
      } = environmentBeforeUpdate.toObject()

      environment = await EnvironmentModel.createEnvironment({
        ..._environmentObject,
        ..._payload,
        workspace: _environmentObject.workspace,
        project: _environmentObject.project,
      })
    }

    return res.status(200).json(environment)
  } catch (err) {
    return next(err)
  }
}
