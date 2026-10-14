import type { Request, Response, NextFunction } from 'express'
import {
  VariableSchemaModel,
  VariablesValueModel,
} from '@multiplayer/models'
import { Types } from 'mongoose'

const deleteVariableValues = async (variableSchemaId: any, projectBranchesId: any[], lastCommitId: any) => {
  const currentProjectBranch = projectBranchesId[projectBranchesId.length - 1]
  const variableValues = await VariablesValueModel.getVariableValuesBySchema(
    variableSchemaId,
    projectBranchesId,
  )

  const promises: Promise<any>[] = []

  for (const variableValue of variableValues) {
    if (variableValue.projectBranch.equals(currentProjectBranch)) {
      promises.push(VariablesValueModel.updateVariableValueById(
        variableSchemaId,
        currentProjectBranch,
        {
          deletedAtCommit: lastCommitId,
        },
      ))
    } else {
      promises.push(VariablesValueModel.createVariableValue({
        ...variableValue.toObject(),
        projectBranch: currentProjectBranch,
        deletedAtCommit: lastCommitId,
      }))
    }
  }
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentVariableSchema = req.variableSchema
    const projectBranch = req.projectBranch
    const lastCommit = req.lastCommit
    const projectBranchId = req.params.projectBranchId as string
    const variableSchemaId = req.params.variableSchemaId as string

    if ((currentVariableSchema.projectBranch as Types.ObjectId).equals(projectBranchId)) {
      await VariableSchemaModel.updateVariableSchemaById(
        variableSchemaId,
        projectBranchId,
        {
          deletedAtCommit: lastCommit._id.toString(),
        },
      )
    } else {
      const {
        _id,
        ...payload
      } = currentVariableSchema.toJSON()

      await VariableSchemaModel.createVariableSchema({
        ...payload,
        projectBranch: projectBranchId,
        deletedAtCommit: lastCommit._id.toString(),
      })
    }

    await deleteVariableValues(
      variableSchemaId,
      [
        ...projectBranch.parentProjectBranch ?
          [projectBranch.parentProjectBranch]
          : [],
        projectBranch._id,
      ],
      lastCommit._id.toString(),
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
