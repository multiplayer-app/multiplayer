import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { MongoPayload } from '@multiplayer/util'
import {
  EnvironmentModel,
  EntityModel,
} from '@multiplayer/models'
import {
  IVariableSchema,
  VariableSchemaEntityType,
  VariableSchemaType,
} from '@multiplayer/types'
import { VariableSchemaLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.query.entity as string
    const archived = Boolean(req.query.archived)
    const type = req.query.type as VariableSchemaType
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = Number(req.query.sortDirection)
    const sortKey = req.query.sortKey as string

    let entityType
    let entity = await EntityModel.findOne({ entityId })
    if (entity) {
      entityType = VariableSchemaEntityType.ENTITY
    } else {
      entity = await EnvironmentModel.findOne({ environmentId: entityId })

      if (entity) {
        entityType = VariableSchemaEntityType.ENVIRONMENT
      } else {
        throw new NotFoundError('Entity not found')
      }
    }

    const cursor: any = {
      skip,
      limit,
    }

    const filter: Partial<IVariableSchema> & {
      archived?: boolean
    } = {
      workspace: workspaceId,
      project: projectId,
      entity: entityId,
      archived,
      projectBranch: projectBranchId,
      type,
    }

    const variableSchemas = await VariableSchemaLib.getVariableSchemaState(
      projectBranchId,
      MongoPayload.removeUndefinedProps(filter),
      cursor,
      {
        sortKey,
        sortDirection,
      },
    )

    return res.status(200).json(variableSchemas)
  } catch (err) {
    return next(err)
  }
}
