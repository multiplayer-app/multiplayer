import type { Request, Response, NextFunction } from 'express'
import { AlertHistoryModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      sortDirection: _sortDirection,
      sortKey: _sortKey,
      alertRuleId: _alertRuleId,
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = Number(_sortDirection)
    const sortKey = _sortKey as string

    const alertHistory = await AlertHistoryModel.findAlertHistory({
      workspace: workspaceId,
      project: projectId,
      alertRule: _alertRuleId as string | undefined,
    }, {
      skip,
      limit,
    }, {
      sortKey,
      sortDirection,
    })

    return res.status(200).json(alertHistory)
  } catch (err) {
    return next(err)
  }
}
