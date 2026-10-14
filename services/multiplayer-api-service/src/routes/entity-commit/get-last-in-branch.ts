import type { Request, Response, NextFunction } from 'express'
import { EntityCommitModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.params.entityId as string

    const { data: [entityCommit] } = await EntityCommitModel.getChangesInBranch(projectBranchId, { entity: entityId })

    if (!entityCommit) {
      throw new NotFoundError(ErrorMessage.ENTITY_STATE_IN_BRANCH_NOT_FOUND)
    }

    return res.status(200).json(entityCommit)
  } catch (err) {
    return next(err)
  }
}
