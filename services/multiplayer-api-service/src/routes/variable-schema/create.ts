import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import {
  VariableSchemaModel,
} from '@multiplayer/models'
import { IVariableSchema } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const lastCommit = req.lastCommit
    const _payload: Partial<IVariableSchema> = req.body

    const payload: Partial<IVariableSchema> = {
      ..._payload,
      variableSchemaId: new mongoose.Types.ObjectId().toString(),
      projectBranch: projectBranchId,
      createdAtCommit: lastCommit._id.toString(),
      workspace: workspaceId,
      project: projectId,
    }

    const variableSchema = await VariableSchemaModel.createVariableSchema(payload)

    return res.status(200).json(variableSchema)
  } catch (err) {
    return next(err)
  }
}
