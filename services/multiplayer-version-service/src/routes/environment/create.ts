import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import {
  EnvironmentModel,
} from '@multiplayer/models'
import { IEnvironment } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const lastCommit = req.lastCommit
    const _payload: Partial<IEnvironment> = req.body

    const payload: Partial<IEnvironment> = {
      ..._payload,
      environmentId: new mongoose.Types.ObjectId().toString(),
      projectBranch: projectBranchId,
      createdAtCommit: lastCommit._id.toString(),
      workspace: workspaceId,
      project: projectId,
    }

    const environment = await EnvironmentModel.createEnvironment(payload)

    return res.status(200).json(environment)
  } catch (err) {
    return next(err)
  }
}
