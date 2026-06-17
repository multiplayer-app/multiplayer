import type { Request, Response, NextFunction } from 'express'
import { AccessControlContext } from '@multiplayer/auth'
import logger from '@multiplayer/logger'
import {
  ProjectModel,
  TeamModel,
  IUserDocument,
} from '@multiplayer/models'
import AMQP from '@multiplayer/amqp'
import { AMQP_CLEANUP_QUEUE } from '../../config'

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

    await AMQP.publish(
      AMQP_CLEANUP_QUEUE,
      {
        variables: {
          type: 'PROJECT',
          workspace: workspaceId,
          project: projectId,
        },
      },
      {
        durable: true,
      },
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
