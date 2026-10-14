import type { Request, Response, NextFunction } from 'express'
import { VariablesValueModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variablesId = req.params.variablesId as string
    const projectBranchId = req.params.projectBranchId as string

    const variableValue = await VariablesValueModel.getVariableValueById(
      variablesId,
      projectBranchId,
    )

    return res.status(200).json(variableValue)
  } catch (err) {
    return next(err)
  }
}
