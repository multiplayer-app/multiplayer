import type { Request, Response, NextFunction } from 'express'
import {
  NotFoundError,
  InvalidContentError,
} from 'restify-errors'
import { EndUserModel } from '@multiplayer/models'
import { EndUserState } from '@multiplayer/types'
import { DebugSessionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const endUserId = req.params.endUserId as string
    const { socketId } = req.query

    const endUser = await EndUserModel.findEndUserByIdAndProjectAndWorkspace(
      endUserId,
      projectId,
      workspaceId,
    )

    if (!endUser) {
      throw new NotFoundError('END_USER_NOT_FOUND')
    }

    if (socketId) {
      const connection = endUser.connections.find((connection) => connection.socketId === socketId)
      if (!connection) {
        throw new NotFoundError('CONNECTION_NOT_FOUND')
      }

      if (connection.state !== EndUserState.RECORDING) {
        throw new InvalidContentError('END_USER_NOT_RECORDING')
      }

      DebugSessionService.stopRemoteRecordingSession(
        workspaceId,
        projectId,
        endUser._id.toString(),
        connection.socketId,
        {},
      )

    } else {
      endUser.connections.map((connection) => {
        if (connection.state !== EndUserState.RECORDING) {
          return
        }

        DebugSessionService.stopRemoteRecordingSession(
          workspaceId,
          projectId,
          endUser._id.toString(),
          connection.socketId,
          {},
        )
      })
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
