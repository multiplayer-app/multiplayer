import type { Request, Response, NextFunction } from 'express'
import {
  IssueModel,
  Config as ModelsConfig,
} from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

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
      ...filters
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : 0
    const limit = 'limit' in req.query ? Number(req.query.limit) : ModelsConfig.LIMIT
    const sortDirection = 'sortDirection' in req.query ? Number(_sortDirection) : undefined
    const sortKey = 'sortKey' in req.query ? req.query.sortKey as string : undefined

    const issue = await IssueModel.findIssueById(issueId)

    if (!issue) {
      throw new NotFoundError(ErrorMessage.ISSUE_NOT_FOUND)
    }

    const issues = await IssueModel.findSimilarIssues({
      workspace: workspaceId,
      project: projectId,
      id: issueId,
      hash: [
        issue.hash,
        issue.componentHash,
        issue.customHash,
      ].filter(Boolean) as string[],
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

    return res.status(200).json(issues)
  } catch (err) {
    return next(err)
  }
}
