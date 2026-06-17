import type { Request, Response, NextFunction } from 'express'
import { IssueModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const issueId = req.params.issueId as string

    const payload = req.body

    const issue = await IssueModel.updateIssueById(
      workspaceId,
      projectId,
      issueId,
      payload,
    )

    return res.status(200).json(issue)
  } catch (err) {
    return next(err)
  }
}
