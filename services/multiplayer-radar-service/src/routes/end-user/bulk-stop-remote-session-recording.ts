import type { Request, Response, NextFunction } from 'express'
import { EndUserModel } from '@multiplayer/models'
import { EndUserState } from '@multiplayer/types'
import { DebugSessionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const endUserIds = req.params.ids as string

    const { data: endUsers } = await EndUserModel.findEndUsers({
      workspace: workspaceId,
      project: projectId,
      _id: endUserIds,
      online: true,
      state: EndUserState.IDLE,
    })

    endUsers.flatMap((endUser) =>
      endUser.connections
        .filter((connection) => connection.state === EndUserState.RECORDING)
        .map((connection) =>
          DebugSessionService.stopRemoteRecordingSession(
            workspaceId,
            projectId,
            endUser._id.toString(),
            connection.socketId,
            {},
          )),
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
