import type { Request, Response, NextFunction } from 'express'
import { InternalError, NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'
import { getLatestEntityState } from '../../lib/project-branch.lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entityId = req.params.entityId as string
    const projectBranchId = req.params.projectBranchId as string

    const state = await getLatestEntityState(projectBranchId, entityId)
    if (!state) {
      return next(new InternalError(`Entity state is missed ${entityId}`))
    }

    if (!state.entityCommit) {
      return next(new NotFoundError(ErrorMessage.ENTITY_COMMIT_NOT_FOUND))
    }

    return res.status(200).json(state.entityCommit)
  } catch (err) {
    return next(err)
  }
}
