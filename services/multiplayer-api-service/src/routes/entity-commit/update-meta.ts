import type { Request, Response, NextFunction } from 'express'
import {
  EntityCommitMetaUpdatePayload, ErrorMessage,
} from '@multiplayer/types'
import { EntityCommitLib } from '../../lib'
import { InternalServerError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entity = req.entity
    const entityId = req.params.entityId as string
    const currentProjectBranch = req.projectBranch
    const lastEntityCommit = req.entityCommit
    const metaPayload = req.body as EntityCommitMetaUpdatePayload || {}

    if (!currentProjectBranch || !lastEntityCommit) {
      throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
    }

    const state = await EntityCommitLib.updateMeta({
      entity,
      entityId,
      lastEntityCommit: lastEntityCommit.toObject(),
      currentProjectBranch,
      metaPayload,
    })
    return res.status(200).json(state.entityCommit)
  } catch (err) {
    return next(err)
  }
}
