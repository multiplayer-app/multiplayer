import type { Request, Response, NextFunction } from 'express'
import {
  EndUserModel,
  DebugSessionModel,
  Config as ModelsConfig,
  IssueEndUserModel,
} from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import {
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
    const endUserId = req.params.endUserId as string
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
    const skip = 'skip' in req.query ? Number(req.query.skip) : 0
    const limit = 'limit' in req.query ? Number(req.query.limit) : ModelsConfig.LIMIT
    const sortDirection = 'sortDirection' in req.query ? Number(_sortDirection) : undefined
    const sortKey = 'sortKey' in req.query ? req.query.sortKey as string : undefined

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

    const issueEndUsers = await IssueEndUserModel.findIssuesEndUsers({
      workspace: workspaceId,
      project: projectId,
      endUser: {
        hash: endUser.hash,
        ...(filters || {}),
      },
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

    const issues = {
      data: issueEndUsers.data.map(issueEndUser => issueEndUser.issue),
      cursor: issueEndUsers.cursor,
    }

    const issueHashes = (issues.data || []).map(issue => issue.hash).filter(Boolean)

    if (issueHashes.length) {
      const seriesByHash = await MetricsService.getMetricsByHash(
        {
          metricName: MetricName.ISSUE_RATE,
          workspaceId,
          projectId,
          issueHash: { $in: issueHashes },
          endUserHash: { $in: [endUser.hash] },
        },
        new Date(fromTimeIso),
        new Date(toTimeIso),
        granularity,
        IssueGroupBy.HASH,
      )

      issues.data = issues.data.map((issue) => ({
        ...issue,
        metrics: {
          [MetricName.ISSUE_RATE]: seriesByHash[issue.hash] || [],
        },
      }))
    }

    return res.status(200).json(issues)
  } catch (err) {
    return next(err)
  }
}
