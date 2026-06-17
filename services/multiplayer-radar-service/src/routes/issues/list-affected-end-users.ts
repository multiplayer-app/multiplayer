import type { Request, Response, NextFunction } from 'express'
import {
  IssueEndUserModel,
  IssueModel,
  Config as ModelsConfig,
} from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'
// import { MetricsService } from '../../services'
// import { MetricsGranularity } from '../../types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const issueId = req.params.issueId as string
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

    // const fromTimeIso = metricsFrom
    //   ? new Date(String(metricsFrom)).toISOString()
    //   : new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    // const toTimeIso = metricsTo
    //   ? new Date(String(metricsTo)).toISOString()
    //   : new Date().toISOString()
    // const granularity = metricsGranularity
    //   ? String(metricsGranularity) as MetricsGranularity
    //   : MetricsGranularity.HOUR

    const issue = await IssueModel.findIssueById(issueId)

    if (!issue) {
      throw new NotFoundError(ErrorMessage.ISSUE_NOT_FOUND)
    }

    const issueEndUsers = await IssueEndUserModel.findIssuesEndUsers({
      workspace: workspaceId,
      project: projectId,
      issue: {
        hash: issue.hash,
        ...(filters || {}),
      },
    }, {
      skip,
      limit,
    }, sortKey && sortDirection ? { sortKey, sortDirection } : undefined)

    const endUsers = {
      data: issueEndUsers.data.map(issueEndUser => issueEndUser.endUser),
      cursor: issueEndUsers.cursor,
    }

    return res.status(200).json(endUsers)
  } catch (err) {
    return next(err)
  }
}
