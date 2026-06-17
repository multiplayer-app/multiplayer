import type { Request, Response, NextFunction } from 'express'
import { EntityCommitLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectBranch, entity } = req
    const entityId = req.params.entityId as string
    const {
      changeType,
      storageType,
      meta,
    } = req.body

    const entityAndCommit = await EntityCommitLib.createEntityCommitWithEntityVersion({
      entity,
      entityId,
      projectBranch,
      payload: {
        changeType,
        storageType,
        meta,
      },
    })

    return res.status(200).json(entityAndCommit.entityCommit)
  } catch (err) {
    return next(err)
  }
}
