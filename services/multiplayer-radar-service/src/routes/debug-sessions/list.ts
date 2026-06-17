import type { Request, Response, NextFunction } from 'express'
import {
  DebugSessionModel,
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
      tags,
      fromContinuousDebugSession,
      live,
      'createdAt.gte': _createdAtGte,
      'createdAt.lte': _createdAtLte,
      ...filters
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : ModelsConfig.SKIP
    const limit = 'limit' in req.query? Number(req.query.limit) : ModelsConfig.LIMIT
    const sortDirection = Number(_sortDirection)
    const sortKey = _sortKey as string

    if (tags) {
      const formattedTags = (tags as string[]).map(tag => {
        const [,key, value] = tag.match(/^(?<KEY>[^:]*):(?<VALUE>.+)$/) || []

        return {
          ...key ? { key }: {},
          value,
        }
      })

      filters.tags = formattedTags
    }

    if (typeof fromContinuousDebugSession === 'boolean') {
      filters.continuousDebugSession = { $exists: fromContinuousDebugSession }
    }

    if (typeof live === 'boolean') {
      (filters as any).stoppedAt = { $exists: !live }
    }

    const filter: any = {
      workspace: workspaceId,
      project: projectId,
      ...(filters || {}),
    }


    if (_createdAtGte) {
      filter.createdAt = {
        $gte: new Date(_createdAtGte as string),
      }
    }

    if (_createdAtLte) {
      filter.createdAt = {
        ...(filter.createdAt || {}),
        $lte: new Date(_createdAtLte as string),
      }
    }

    const debugSessions = await DebugSessionModel.findDebugSessions(
      filter,
      {
        skip,
        limit,
      }, {
        sortKey,
        sortDirection,
      },
    )

    return res.status(200).json(debugSessions)
  } catch (err) {
    return next(err)
  }
}
