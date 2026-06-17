import type { Request, Response, NextFunction } from 'express'
import { VariablesValueModel } from '@multiplayer/models'
import { Types } from 'mongoose'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentVariableValue = req.variableValue
    const lastCommit = req.lastCommit
    const projectBranchId = req.params.projectBranchId as string
    const variableValueId = req.params.variableValueId as string

    if ((currentVariableValue.projectBranch as Types.ObjectId).equals(projectBranchId)) {
      await VariablesValueModel.updateVariableValueById(
        variableValueId,
        projectBranchId,
        {
          deletedAtCommit: lastCommit._id.toString(),
        },
      )
    } else {
      const {
        _id,
        ...payload
      } = currentVariableValue.toJSON()

      await VariablesValueModel.createVariableValue({
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
