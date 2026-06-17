import type { Request, Response, NextFunction } from 'express'
import { EndUserModel, IssueEndUserModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const endUserId = req.params.endUserId as string

    await EndUserModel.removeEndUserById(
      endUserId,
    )

    await IssueEndUserModel.bulkDeleteIssuesEndUsersByEndUser(
      workspaceId,
      projectId,
      {
        ids: [endUserId],
      },
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
