import type { Request, Response, NextFunction } from 'express'
import { IssueService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = req.params.issueId as string

    await IssueService.removeIssue(issueId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
