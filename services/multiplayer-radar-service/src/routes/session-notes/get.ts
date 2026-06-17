import type { Request, Response, NextFunction } from 'express'
import { SessionNoteModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { s3 } from '@multiplayer/s3'
import { SessionNoteKey } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debugSessionId = req.params.debugSessionId as string

    const note = await SessionNoteModel.findSessionNote(debugSessionId)

    if (!note) {
      throw new NotFoundError('No session notes found.')
    }

    const stateUrl = await s3.getPresignedDownloadUrl(`${note.prefix}/${SessionNoteKey.STATE}`, note.bucket)

    return res.status(200).json({
      ...note.toJSON(), stateUrl,
    })
  } catch (err) {
    return next(err)
  }
}
