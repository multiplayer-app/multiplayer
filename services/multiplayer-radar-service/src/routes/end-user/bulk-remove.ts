import type { Request, Response, NextFunction } from 'express'
import { EndUserModel, IssueEndUserModel } from '@multiplayer/models'
import { MetricsService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      ids: endUserIds,
    } = req.body

    let endUserHashes: string[] | undefined

    if (endUserIds?.length) {
      const { data: __endUserHashes } = await EndUserModel.findEndUsers(
        {
          workspace: workspaceId,
          project: projectId,
          _id: endUserIds,
        },
        undefined,
        undefined,
        { hash: 1 },
      )

      endUserHashes = __endUserHashes.map(({ hash }) => hash)
    }

    await EndUserModel.bulkDeleteEndUsersByIds(
      workspaceId,
      projectId,
      endUserIds,
    )

    await IssueEndUserModel.bulkDeleteIssuesEndUsersByEndUser(
      workspaceId,
      projectId,
      {
        ids: endUserIds,
      },
    )

    await MetricsService.removeMetricsForEndUsers({
      workspaceId,
      projectId,
      endUserHash: endUserHashes,
    })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
