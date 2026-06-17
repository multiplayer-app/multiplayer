import type { Request, Response, NextFunction } from 'express'
import { VariableSchemaModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const variablesId = req.params.variablesId as string
    const projectBranchId = req.params.projectBranchId as string

    const variableSchema = await VariableSchemaModel.getVariableSchemaById(
      variablesId,
      projectBranchId,
    )

    return res.status(200).json(variableSchema)
  } catch (err) {
    return next(err)
  }
}
