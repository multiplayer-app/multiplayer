import type { Request, Response, NextFunction } from 'express'
import { IssueService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const filters = req.body

    await IssueService.bulkRemoveIssues(
      workspaceId,
      projectId,
      filters,
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
