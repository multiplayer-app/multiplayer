import type { Request, Response, NextFunction } from 'express'
import { SessionNoteModel } from '@multiplayer/models'
import { EntityConverter, SessionNotesTemplates } from '@multiplayer/entity'
import { NotesType, SessionNoteKey } from '@multiplayer/types'
import { S3_DEBUG_SESSIONS_BUCKET } from '../../config'
import { s3 } from '@multiplayer/s3'
import { getS3DebugSessionFolder } from '../../helpers/debug-session.helper'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string

    const content = SessionNotesTemplates.empty()
    const state = EntityConverter.convertDataToState(NotesType.SESSION, content)
    const note = await SessionNoteModel.createSessionNote({
      content: JSON.stringify(content),
      session: debugSessionId,
      workspace: workspaceId,
      project: projectId,
      bucket: S3_DEBUG_SESSIONS_BUCKET,
      prefix: getS3DebugSessionFolder({ workspaceId, projectId, debugSessionId }),
    })
    await s3.uploadFile(`${note.prefix}/${SessionNoteKey.STATE}`, note.bucket, state)
    const stateUrl = await s3.getPresignedDownloadUrl(`${note.prefix}/${SessionNoteKey.STATE}`, note.bucket)

    return res.status(201).json({
      ...note.toJSON(), stateUrl,
    })
  } catch (err) {
    return next(err)
  }
}


