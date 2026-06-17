import type { Request, Response, NextFunction } from 'express'
import { SessionNoteModel } from '@multiplayer/models'
import { s3 } from '@multiplayer/s3'
import crypto from 'crypto'
import { generateImagesFromEvents } from './image-handler'
import { loadRrwebEvents } from './load-rrweb-events'

const getBase64Hash = (base64: string | Buffer) => {
  return crypto
    .createHash('sha256')
    .update(base64 as any)
    .digest('hex')
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debugSessionId = req.params.debugSessionId as string
    const note = await SessionNoteModel.findSessionNote(debugSessionId)

    if (!note) {
      return res.status(200).json({
        data: [],
      })
    }
    const hash = getBase64Hash(note.content)
    const content = JSON.parse(note.content)
    const availableFiles = await s3.listObjectsByPrefix(
      note.bucket,
      `${note.prefix}/images/${hash}`,
    )

    if (availableFiles.Contents && availableFiles.Contents.length > 0) {
      const images = await Promise.all(
        availableFiles.Contents.map((f) =>
          s3.getPresignedDownloadUrl(f.Key as string, note.bucket),
        ),
      )
      return res.status(200).json({
        content,
        imageUrls: images,
      })
    }

    const debugSession = req.debugSession.toObject()
    const events = await loadRrwebEvents({
      debugSession,
      debugSessionId,
      headers: req.headers as Record<string, string>,
    })

    const images = await generateImagesFromEvents(events, content)
    const nextWeekTimestamp = Date.now() + 7 * 24 * 60 * 60 * 1000
    await Promise.all(
      images.map(({ data, id }) => {
        return s3.uploadFile(
          `${note.prefix}/images/${hash}-${id}.jpeg`,
          note.bucket,
          data,
          new Date(nextWeekTimestamp),
        )
      }),
    )

    const urls = await Promise.all(
      images.map(({ id }) => {
        return s3.getPresignedDownloadUrl(
          `${note.prefix}/images/${hash}-${id}.jpeg`,
          note.bucket,
        )
      }),
    )

    return res.status(200).json({
      content,
      imageUrls: urls,
    })
  } catch (err) {
    return next(err)
  }
}
