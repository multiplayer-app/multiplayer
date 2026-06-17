import type { Request, Response, NextFunction } from 'express'
import {
  EndUserModel,
  Config as ModelsConfig,
} from '@multiplayer/models'
import {
  MetricName ,
  IssueGroupBy,
} from '@multiplayer/types'
import { MetricsService } from '../../services'
import {
  MetricsGranularity,
} from '../../types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      skip: _skip,
      limit: _limit,
      sortDirection: _sortDirection,
      sortKey: _sortKey,
      'metrics.from': metricsFrom,
      'metrics.to': metricsTo,
      'metrics.granularity': metricsGranularity,
      ...filters
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : ModelsConfig.SKIP
    const limit = 'limit' in req.query? Number(req.query.limit) : ModelsConfig.LIMIT
    const sortDirection = Number(_sortDirection)
    const sortKey = _sortKey as string

    const fromTimeIso = metricsFrom
      ? new Date(String(metricsFrom)).toISOString()
      : new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    const toTimeIso = metricsTo
      ? new Date(String(metricsTo)).toISOString()
      : new Date().toISOString()
    const granularity = metricsGranularity
      ? String(metricsGranularity) as MetricsGranularity
      : MetricsGranularity.HOUR

    const endUsers = await EndUserModel.findEndUsers({
      workspace: workspaceId,
      project: projectId,
      ...(filters || {}),
    }, {
      skip,
      limit,
    }, {
      sortKey,
      sortDirection,
    })


    const endUserHashes = (endUsers.data || []).map((eu: any) => eu.hash).filter(Boolean)

    let issueSeriesByEndUser: Record<string, { time: string, value: number }[]> = {}
    let sessionSeriesByEndUser: Record<string, { time: string, value: number }[]> = {}

    if (endUserHashes.length) {
      const [_issueSeriesByEndUser, _sessionSeriesByEndUser] = await Promise.all([
        MetricsService.getMetricsByHash(
          {
            metricName: MetricName.ISSUE_RATE,
            workspaceId,
            projectId,
            endUserHash: { $in: endUserHashes },
          },
          new Date(fromTimeIso),
          new Date(toTimeIso),
          granularity,
          IssueGroupBy.END_USER_HASH,
        ),
        MetricsService.getMetricsByHash(
          {
            metricName: MetricName.SESSION_RECORDING_RATE,
            workspaceId,
            projectId,
            endUserHash: { $in: endUserHashes },
          },
          new Date(fromTimeIso),
          new Date(toTimeIso),
          granularity,
          IssueGroupBy.END_USER_HASH,
        ),
      ])

      issueSeriesByEndUser = _issueSeriesByEndUser
      sessionSeriesByEndUser = _sessionSeriesByEndUser
    }

    endUsers.data = endUsers.data.map((_endUser) => ({
      ..._endUser,
      online: _endUser.connections.length > 0,
      metrics: {
        [MetricName.ISSUE_RATE]: issueSeriesByEndUser[_endUser.hash] || [],
        [MetricName.SESSION_RECORDING_RATE]: sessionSeriesByEndUser[_endUser.hash] || [],
      },
    }))

    return res.status(200).json(endUsers)
  } catch (err) {
    return next(err)
  }
}
