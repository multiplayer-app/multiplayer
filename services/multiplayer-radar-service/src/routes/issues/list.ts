import type { Request, Response, NextFunction } from 'express'
import {
  IssueModel,
  Config as ModelsConfig,
} from '@multiplayer/models'
import {
  MetricName,
  IssueGroupBy,
} from '@multiplayer/types'
import { MetricsService } from '../../services'
import {
  MetricsGranularity,
} from '../../types'

const fieldMapping = {
  [IssueGroupBy.HASH]: 'issueHash',
  [IssueGroupBy.END_USER_HASH]: 'endUserHash',
  [IssueGroupBy.COMPONENT_HASH]: 'issueComponentHash',
  [IssueGroupBy.CUSTOM_HASH]: 'issueCustomHash',
  [IssueGroupBy.SESSION_ID]: 'sessionId',
  [IssueGroupBy.TITLE_HASH]: 'issueTitleHash',
}

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
      'metrics.groupBy': _metricsGroupBy,
      ...filters
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : 0
    const limit = 'limit' in req.query ? Number(req.query.limit) : ModelsConfig.LIMIT
    const sortDirection = 'sortDirection' in req.query ? Number(_sortDirection) : undefined
    const sortKey = 'sortKey' in req.query ? req.query.sortKey as string : undefined

    const metricsGroupBy = _metricsGroupBy as IssueGroupBy || IssueGroupBy.HASH
    const fromTimeIso = metricsFrom
      ? new Date(String(metricsFrom)).toISOString()
      : new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    const toTimeIso = metricsTo
      ? new Date(String(metricsTo)).toISOString()
      : new Date().toISOString()
    const granularity = metricsGranularity
      ? String(metricsGranularity) as MetricsGranularity
      : MetricsGranularity.HOUR

    const issues = await IssueModel.findIssues(
      {
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

    const issueFilterFields = (issues?.data || []).map(issue => issue[metricsGroupBy]).filter(Boolean)
    let seriesByHash: Record<string, { time: string, value: number }[]> = {}

    if (issueFilterFields.length) {
      seriesByHash = await MetricsService.getMetricsByHash(
        {
          metricName: MetricName.ISSUE_RATE,
          workspaceId,
          projectId,
          [fieldMapping[metricsGroupBy]]: { $in: issueFilterFields },
        },
        new Date(fromTimeIso),
        new Date(toTimeIso),
        granularity,
        metricsGroupBy,
      )
    }

    issues.data = issues.data.map((issue) => ({
      ...issue,
      metrics: {
        [MetricName.ISSUE_RATE]: seriesByHash[issue[metricsGroupBy]] || [],
      },
    }))

    return res.status(200).json(issues)
  } catch (err) {
    return next(err)
  }
}
