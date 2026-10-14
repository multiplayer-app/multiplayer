import type { Request, Response, NextFunction } from 'express'
import { AccessControlContext } from '@multiplayer/auth'
import logger from '@multiplayer/logger'
import {
  ProjectModel,
  TeamModel,
  IUserDocument,
} from '@multiplayer/models'
import { CleanupUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as IUserDocument
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string

    await ProjectModel.deleteProjectById(projectId)

    logger.info({
      user: user._id,
      workspace: workspaceId,
      project: projectId,
    }, 'Project was deleted')

    await TeamModel.removeProjectFromAllTeams(projectId)

    await AccessControlContext.invalidateContext({
      workspaceId,
    })

    // Fired off, not awaited: cleanup runs in the background, same as when this
    // went through the `cleanup` AMQP queue. cleanupProject catches and logs
    // its own errors, so nothing here needs to handle rejection.
    CleanupUtil.cleanupProject(workspaceId, projectId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
