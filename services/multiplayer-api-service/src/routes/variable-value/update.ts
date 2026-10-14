import type { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import {
  VariablesValueModel,
  // IEnvironmentVariablesDocument,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastCommit = req.lastCommit
    const variableValueBeforeUpdate = req.variableValue
    const variableValueId = req.params.variableValueId as string
    const projectBranchId = req.params.projectBranchId as string
    const {
      archived,
      ..._payload
    } = req.body

    if (archived) {
      _payload.archivedAtCommit = lastCommit._id.toString()
    }

    let variableValue

    if ((variableValueBeforeUpdate.projectBranch as Types.ObjectId).equals(projectBranchId)) {
      variableValue = await VariablesValueModel.updateVariableValueById(
        variableValueId,
        projectBranchId,
        _payload,
      )
    } else {
      const {
        _id,
        ..._variables
      } = variableValueBeforeUpdate.toObject()

      variableValue = await VariablesValueModel.createVariableValue({
        ..._variables,
        ..._payload,
        workspace: _variables.workspace,
        project: _variables.project,
      })
    }

    return res.status(200).json(variableValue)
  } catch (err) {
    return next(err)
  }
}
