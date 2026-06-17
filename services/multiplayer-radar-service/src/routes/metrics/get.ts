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
      issueTitleHash,
      issueComponentHash,
      issueCustomHash,
      endUserHash,
      groupBy: _groupBy,
      issueId,
      from,
      to,
      granularity: _granularity,
      release,
      environment,
      metricName,
    } = req.query

    const groupBy = _groupBy
      ? IssueGroupBy[_groupBy as IssueGroupBy]
      : IssueGroupBy.TITLE_HASH

    const metricNames = (Array.isArray(metricName)
      ? metricName
      : [metricName]) as MetricName[]

    const fromTimeIso = from
      ? new Date(String(from)).toISOString()
      : new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    const toTimeIso = to
      ? new Date(String(to)).toISOString()
      : new Date().toISOString()
    const granularity = _granularity
      ? String(_granularity) as MetricsGranularity
      : MetricsGranularity.HOUR

    let issue

    if (issueId) {
      issue = await IssueModel.findIssueById(issueId as string)

      if (!issue) {
        throw new NotFoundError(ErrorMessage.ISSUE_NOT_FOUND)
      }
    }

    const metrics = {} as Record<MetricName, { time: string, value: number }[]>

    for (const metricName of metricNames) {
      const seriesByHash = await MetricsService.getMetrics(
        {
          metricName,
          workspaceId,
          projectId,
          release: release as string | undefined,
          environment: environment as string | undefined,
          ...issue?.[groupBy]
            ? { [fieldMapping[groupBy]]: { $in: [issue[groupBy]] } }
            : {},
          ...issueTitleHash
            ? { issueTitleHash: { $in: [issueTitleHash as string] } }
            : {},
          ...issueComponentHash
            ? { issueComponentHash: { $in: [issueComponentHash as string] } }
            : {},
          ...issueCustomHash
            ? { issueCustomHash: { $in: [issueCustomHash as string] } }
            : {},
          ...endUserHash
            ? { endUserHash: { $in: [endUserHash as string] } }
            : {},
        },
        new Date(fromTimeIso),
        new Date(toTimeIso),
        granularity,
        undefined,
        metricName === MetricName.SESSION_RECORDING_WITH_ERROR_RATE
          ? IssueGroupBy.SESSION_ID
          : undefined,
      )

      metrics[metricName] = seriesByHash || []
    }

    return res.status(200).json(metrics)
  } catch (err) {
    return next(err)
  }
}
