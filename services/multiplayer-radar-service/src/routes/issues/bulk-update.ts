import type { Request, Response, NextFunction } from 'express'
import { IssueModel, IssueEndUserModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      filter,
      payload,
    } = req.body

    const issues = await IssueModel.bulkUpdateIssues(
      workspaceId,
      projectId,
      filter,
      payload,
    )

    await IssueEndUserModel.bulkUpdateIssuesEndUsersByIssue(
      workspaceId,
      projectId,
      filter,
      payload,
    )

    return res.status(200).json(issues.map(issue => issue.toObject()))
  } catch (err) {
    return next(err)
  }
}
