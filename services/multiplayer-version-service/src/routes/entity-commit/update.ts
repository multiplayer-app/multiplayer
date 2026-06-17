import type { Request, Response, NextFunction } from 'express'
import {
  EntityCommitModel,
  IEntityCommitDocument,
} from '@multiplayer/models'
import {
  EntityCommitStatus,
} from '@multiplayer/types'
import { MongoPayload } from '@multiplayer/util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entityCommitId = req.params.entityCommitId as string
    const status = req.body.status as EntityCommitStatus
    const name = req.body.name as string
    const payload: Partial<IEntityCommitDocument> = MongoPayload.removeUndefinedProps({ status, name })
    const entityCommit = await EntityCommitModel.updateEntityCommitById(
      entityCommitId,
      payload,
    )

    return res.status(200).json(entityCommit)
  } catch (err) {
    return next(err)
  }
}
