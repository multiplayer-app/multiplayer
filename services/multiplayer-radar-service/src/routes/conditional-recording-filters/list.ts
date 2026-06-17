import type { Request, Response, NextFunction } from 'express'
import {
  ConditionalRecordingFiltersModel,
  Config as ModelsConfig,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      skip: _skip,
      limit: _limit,
      sortDirection: _sortDirection,
      sortKey: _sortKey,
      ...filters
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : 0
    const limit = 'limit' in req.query ? Number(req.query.limit) : ModelsConfig.LIMIT
    const sortDirection = 'sortDirection' in req.query ? Number(_sortDirection) : undefined
    const sortKey = 'sortKey' in req.query ? req.query.sortKey as string : undefined

    const remoteSessionRecordingConditions = await ConditionalRecordingFiltersModel.findConditionalRecordingFilters({
      workspace: workspaceId,
      project: projectId,
      ...(filters || {}),
    }, {
      skip,
      limit,
    },
    sortKey && sortDirection
      ? {
        sortKey,
        sortDirection,
      }
      : undefined,
    )

    return res.status(200).json(remoteSessionRecordingConditions)
  } catch (err) {
    return next(err)
  }
}
