import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import {
  VariablesValueModel,
} from '@multiplayer/models'
import { IVariableValue } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const lastCommit = req.lastCommit
    const _payload: Partial<IVariableValue> = req.body

    const payload: Partial<IVariableValue> = {
      ..._payload,
      variableValueId: new mongoose.Types.ObjectId().toString(),
      projectBranch: projectBranchId,
      createdAtCommit: lastCommit._id.toString(),
      workspace: workspaceId,
      project: projectId,
    }

    const variableValue = await VariablesValueModel.createVariableValue(payload)

    return res.status(200).json(variableValue)
  } catch (err) {
    return next(err)
  }
}
