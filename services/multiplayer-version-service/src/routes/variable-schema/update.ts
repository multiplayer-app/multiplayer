import type { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import {
  VariableSchemaModel,
  VariablesValueModel,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastCommit = req.lastCommit
    const variableSchemaBeforeUpdate = req.variableSchema
    const projectBranchIds = req.projectBranchTree.map(({ _id }) => _id)
    const variableSchemaId = req.params.variableSchemaId as string
    const projectBranchId = req.params.projectBranchId as string
    const {
      archived,
      ..._payload
    } = req.body

    if (archived) {
      _payload.archivedAtCommit = lastCommit._id.toString()
    }

    let variableSchema

    if ((variableSchemaBeforeUpdate.projectBranch as Types.ObjectId).equals(projectBranchId)) {
      variableSchema = await VariableSchemaModel.updateVariableSchemaById(
        variableSchemaId,
        projectBranchId,
        _payload,
      )
    } else {
      const {
        _id,
        ..._variables
      } = variableSchemaBeforeUpdate.toObject()

      variableSchema = await VariableSchemaModel.createVariableSchema({
        ..._variables,
        ..._payload,
        workspace: _variables.workspace,
        project: _variables.project,
      })
    }

    const variableSchemaObject = variableSchema.toObject()

    const variableValues = await VariablesValueModel.getVariableValuesBySchema(
      variableSchema.variableSchemaId,
      projectBranchIds,
    )

    variableSchemaObject.variableValues = variableValues

    return res.status(200).json(variableSchemaObject)
  } catch (err) {
    return next(err)
  }
}
