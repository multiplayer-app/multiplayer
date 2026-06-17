import type { Request, Response, NextFunction } from 'express'
import { BadRequestError } from 'restify-errors'
import { SessionNoteModel } from '@multiplayer/models'
import { SessionNoteType } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { generateSnapshotAtTimestamp } from './image-handler'
import { loadRrwebEvents } from './load-rrweb-events'

/**
 * Returns the metadata of a sketch annotation drawn at the given timestamp, if any,
 * so the snapshot can render the user's annotation as an overlay. Metadata is kept as the
 * raw JSON string the image handler expects.
 */
const findSketchMetadataAtTimestamp = async (
  debugSessionId: string,
  timestamp: number,
): Promise<string | undefined> => {
  try {
    const note = await SessionNoteModel.findSessionNote(debugSessionId)
    if (!note?.content) {
      return undefined
    }
    const doc = JSON.parse(note.content)
    const blocks: Array<{ type?: string; attrs?: Record<string, unknown> }> =
      doc?.content || []
    const match = blocks.find(
      ({ type, attrs }) =>
        type === 'session-note-block' &&
        attrs?.type === SessionNoteType.Sketch &&
        Number(attrs?.timestamp) === timestamp,
    )
    const metadata = match?.attrs?.metadata
    return typeof metadata === 'string' ? metadata : undefined
  } catch (err) {
    logger.error('Error loading sketch metadata for snapshot:', err)
    return undefined
  }
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debugSessionId = req.params.debugSessionId as string
    const timestampRaw = req.query.timestamp as string | undefined

    if (timestampRaw === undefined || timestampRaw === '') {
      throw new BadRequestError('timestamp query parameter is required')
    }

    const timestamp = Number(timestampRaw)
    if (!Number.isFinite(timestamp) || timestamp < 0) {
      throw new BadRequestError('timestamp must be a non-negative number')
    }

    const debugSession = req.debugSession.toObject()
    const events = await loadRrwebEvents({
      debugSession,
      debugSessionId,
      headers: req.headers as Record<string, string>,
    })

    if (!events.length) {
      return res
        .status(404)
        .json({ message: 'No rrweb events found for this session' })
    }

    const sketchMetadata = await findSketchMetadataAtTimestamp(
      debugSessionId,
      Math.floor(timestamp),
    )

    const image = await generateSnapshotAtTimestamp(
      events,
      Math.floor(timestamp),
      sketchMetadata,
    )
    if (!image) {
      return res.status(404).json({ message: 'Failed to generate snapshot' })
    }

    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    return res.status(200).send(Buffer.from(image))
  } catch (err) {
    return next(err)
  }
}
