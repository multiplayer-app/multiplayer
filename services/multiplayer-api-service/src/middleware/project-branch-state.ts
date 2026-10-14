import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchLib } from '../lib'
import { EntityType, ErrorMessage } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'

export const attachProjectBranchState = async (req: Request, res: Response, next: NextFunction) => {
  const projectBranchId = req.params.projectBranchId as string

  const filter: {
    type?: EntityType,
    entityId?: string[]
  } = {}

  if (req?.query?.entityId) {
    filter.entityId = [req.query.entityId as string]
  } else if (req?.body?.entityIds?.length) {
    filter.entityId = req.body.entityIds
  } else if (req?.params?.entityId) {
    filter.entityId = [req.params.entityId as string]
  }

  if (
    req?.body?.type
    && Object.values(EntityType).includes(req?.body?.type)
  ) {
    filter.type = req?.body?.type as EntityType
  } else if (
    req?.query?.type
    && Object.values(EntityType).includes(req?.query?.type as any)
  ) {
    filter.type = req?.query?.type as EntityType
  }

  const { data: projectBranchState } = await ProjectBranchLib.getProjectBranchState(
    projectBranchId,
    filter,
  )

  req.projectBranchState = projectBranchState

  next()
}

export const validateCanAccessEnvironment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const environmentId = req.body.environment
    const projectBranchId = req.params.projectBranchId
    const state = await ProjectBranchLib.getProjectBranchState(projectBranchId, {
      type: EntityType.ENVIRONMENT,
      entityId: environmentId,
    })

    if (!state.data.length) {
      return next(new NotFoundError(ErrorMessage.ENV_NOT_FOUND))
    }

    next()
  } catch (err) {
    next(err)
  }
}
