import type { Request, Response, NextFunction } from 'express'
import { IssueModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import {
  ErrorMessage,
  MetricName,
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
    const issueId = req.params.issueId as string
    const {
      'metrics.from': metricsFrom,
      'metrics.to': metricsTo,
      'metrics.granularity': metricsGranularity,
      'metrics.groupBy': _metricsGroupBy,
    } = req.query

    const metricsGroupBy = _metricsGroupBy as IssueGroupBy || IssueGroupBy.COMPONENT_HASH
    const fromTimeIso = metricsFrom
      ? new Date(String(metricsFrom)).toISOString()
      : new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    const toTimeIso = metricsTo
      ? new Date(String(metricsTo)).toISOString()
      : new Date().toISOString()
    const granularity = metricsGranularity
      ? String(metricsGranularity) as MetricsGranularity
      : MetricsGranularity.HOUR

    const issue = await IssueModel.findIssueById(issueId)

    if (!issue) {
      throw new NotFoundError(ErrorMessage.ISSUE_NOT_FOUND)
    }

    const issueObject = issue.toObject() as any

    const issueRateMetrics = await MetricsService.getMetrics(
      {
        metricName: MetricName.ISSUE_RATE,
        workspaceId,
        projectId,
        issueHash: {
          $in: [issueObject[IssueGroupBy.HASH]],
        },
      },
      new Date(fromTimeIso),
      new Date(toTimeIso),
      granularity,
      metricsGroupBy,
    )

    issueObject.metrics = {
      [MetricName.ISSUE_RATE]: issueRateMetrics || [],
    }

    return res.status(200).json(issueObject)
  } catch (err) {
    return next(err)
  }
}
