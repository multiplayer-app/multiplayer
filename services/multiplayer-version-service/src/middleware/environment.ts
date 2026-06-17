import type { Request, Response, NextFunction } from 'express'
import {
  EnvironmentModel,
} from '@multiplayer/models'
import {
  NotFoundError,
} from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const attachEnvironment = async (req: Request, res: Response, next: NextFunction) => {
  const environmentId = req.params.environmentId as string

  const projectBranchIds = req.projectBranchTree.map(({ _id }) => _id)

  const environment = await EnvironmentModel.getEnvironmentById(
    environmentId,
    projectBranchIds,
  )

  if (!environment) {
    return next(new NotFoundError(ErrorMessage.ENV_NOT_FOUND))
  }

  req.environment = environment

  next()
}
