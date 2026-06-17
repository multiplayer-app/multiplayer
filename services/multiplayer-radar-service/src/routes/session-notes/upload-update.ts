import type { Request, Response, NextFunction } from 'express'
import { s3 } from '@multiplayer/s3'
import { SessionNoteModel, SessionNotesUpdateModel } from '@multiplayer/models'
import { YjsUpdateStatus } from '@multiplayer/types'
import { BadRequestError, NotFoundError } from 'restify-errors'
import { KAFKA_SESSION_NOTES_UPDATE_TOPIC } from '../../config'
import { kafkaProducer } from '../../libs'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string
    const updateId = req.params.updateId as string

    const update = await SessionNotesUpdateModel.getSessionNotesUpdate(updateId)
    if (
      !update ||
      !update.workspace.equals(workspaceId) ||
      !update.project.equals(projectId) ||
      !update.session.equals(debugSessionId)
    ) {
      throw new NotFoundError('update not found')
    }
    const note = await SessionNoteModel.findSessionNote(debugSessionId)
    if (!note) {
      throw new NotFoundError('Note not found')
    }

    if (update.status === YjsUpdateStatus.DONE) {
      throw new BadRequestError('Update is already uploaded')
    }
    const key =`${note.prefix}/yjs/${updateId}`

    const { writeStream, promise } = s3.streamUpload(
      key,
      note.bucket,
    )

    req.pipe(writeStream)


    const data = await promise
    await SessionNotesUpdateModel.updateSessionNotesUpdate(updateId, {
      status: YjsUpdateStatus.DONE,
      key,
      bucket: note.bucket,
    })

    await kafkaProducer.send(KAFKA_SESSION_NOTES_UPDATE_TOPIC, {
      workspace: workspaceId,
      project: projectId,
      session: debugSessionId,
    })
    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}