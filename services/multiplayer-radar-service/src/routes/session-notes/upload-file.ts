import type { Request, Response, NextFunction } from 'express'
import { s3 } from '@multiplayer/s3'
import { SessionNoteModel } from '@multiplayer/models'
import { SessionNoteKey } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string
    const blockId = req.params.blockId as string


    // Find the session note to get the prefix
    const sessionNote = await SessionNoteModel.findSessionNote(debugSessionId)
    if (
      !sessionNote ||
      !sessionNote.workspace.equals(workspaceId) ||
      !sessionNote.project.equals(projectId) ||
      !sessionNote.session.equals(debugSessionId)
    ) {
      throw new NotFoundError('session note not found')
    }

    // Construct the S3 key for the file
    const key = `${sessionNote.prefix}/${SessionNoteKey.UPLOADS}/${blockId}`

    // Stream upload the file to S3
    const { writeStream, promise } = s3.streamUpload(
      key,
      sessionNote.bucket,
    )

    req.pipe(writeStream)

    // Wait for upload to complete
    await promise

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
