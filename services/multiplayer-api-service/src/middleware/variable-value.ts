import type { Request, Response, NextFunction } from 'express'
import {
  VariablesValueModel,
} from '@multiplayer/models'
import {
  NotFoundError,
} from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const attachVariableValue = async (req: Request, res: Response, next: NextFunction) => {
  const variableValueId = req.params.variableValueId as string

  const projectBranchIds = req.projectBranchTree.map(({ _id }) => _id)

  const variableValue = await VariablesValueModel.getVariableValueById(
    variableValueId,
    projectBranchIds,
  )

  if (!variableValue) {
    return next(new NotFoundError(ErrorMessage.VARIABLE_VAlUE_NOT_FOUND))
  }

  req.variableValue = variableValue

  next()
}
