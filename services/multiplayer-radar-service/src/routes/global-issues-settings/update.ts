import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'
import { ProjectCache } from '../../cache'
import { ProjectService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string

    const payload = req.body

    const issuesSettings = await ProjectModel.updateIssuesSettings(
      projectId,
      payload,
    )

    await ProjectService.invalidateProjectCache(projectId)

    return res.status(200).json(issuesSettings)
  } catch (err) {
    return next(err)
  }
}
