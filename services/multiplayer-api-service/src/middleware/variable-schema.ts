import type { Request, Response, NextFunction } from 'express'
import {
  VariableSchemaModel,
} from '@multiplayer/models'
import {
  NotFoundError,
} from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const attachVariableSchema = async (req: Request, res: Response, next: NextFunction) => {
  const variableSchemaId = req.params.variableSchemaId as string

  const projectBranchIds = req.projectBranchTree.map(({ _id }) => _id)

  const variableSchema = await VariableSchemaModel.getVariableSchemaById(
    variableSchemaId,
    projectBranchIds,
  )

  if (!variableSchema) {
    return next(new NotFoundError(ErrorMessage.VARIABLE_SCHEMA_NOT_FOUND))
  }

  req.variableSchema = variableSchema

  next()
}
