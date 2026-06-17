import type { Request, Response, NextFunction } from 'express'
import { EndUserModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import {
  MetricName,
  IssueGroupBy,
} from '@multiplayer/types'
import {
  MetricsGranularity,
} from '../../types'
import { MetricsService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const endUserId = req.params.endUserId as string
    const {
      'metrics.from': metricsFrom,
      'metrics.to': metricsTo,
      'metrics.granularity': metricsGranularity,
    } = req.query

    const fromTimeIso = metricsFrom
      ? new Date(String(metricsFrom)).toISOString()
      : new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    const toTimeIso = metricsTo
      ? new Date(String(metricsTo)).toISOString()
      : new Date().toISOString()
    const granularity = metricsGranularity
      ? String(metricsGranularity) as MetricsGranularity
      : MetricsGranularity.HOUR

    const endUser = await EndUserModel.findEndUserByIdAndProjectAndWorkspace(
      endUserId,
      projectId,
      workspaceId,
    )

    if (!endUser) {
      throw new NotFoundError('END_USER_NOT_FOUND')
    }

    let issueSeriesByEndUser: Record<string, { time: string, value: number }[]> = {}
    let sessionSeriesByEndUser: Record<string, { time: string, value: number }[]> = {}

    const endUserObject = endUser.toObject()

    const [_issueSeriesByEndUser, _sessionSeriesByEndUser] = await Promise.all([
      MetricsService.getMetricsByHash(
        {
          metricName: MetricName.ISSUE_RATE,
          workspaceId,
          projectId,
          endUserHash: { $in: [endUserObject.hash] },
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
          endUserHash: { $in: [endUserObject.hash] },
        },
        new Date(fromTimeIso),
        new Date(toTimeIso),
        granularity,
        IssueGroupBy.END_USER_HASH,
      ),
    ])

    issueSeriesByEndUser = _issueSeriesByEndUser
    sessionSeriesByEndUser = _sessionSeriesByEndUser

    endUserObject.metrics = {
      [MetricName.ISSUE_RATE]: issueSeriesByEndUser[endUserObject.hash] || [],
      [MetricName.SESSION_RECORDING_RATE]: sessionSeriesByEndUser[endUserObject.hash] || [],
    }

    endUserObject.online = endUser.connections.length > 0

    return res.status(200).json(endUserObject)
  } catch (err) {
    return next(err)
  }
}
