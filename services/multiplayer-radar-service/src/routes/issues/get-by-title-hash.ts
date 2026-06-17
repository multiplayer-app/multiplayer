import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'
import { IssueService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const titleHash = req.params.titleHash as string

    const issue = await IssueService.getIssueByTitleHash(
      workspaceId,
      projectId,
      titleHash,
    )

    if (!issue) {
      throw new NotFoundError(ErrorMessage.ISSUE_NOT_FOUND)
    }

    return res.status(200).json(issue)
  } catch (err) {
    return next(err)
  }
}
