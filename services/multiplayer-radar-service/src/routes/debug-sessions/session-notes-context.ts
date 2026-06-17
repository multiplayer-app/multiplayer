import type { Request, Response, NextFunction } from 'express'
import { getSessionNotesContext } from '../../services/session-notes-context.service'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debugSessionId = req.params.debugSessionId as string

    const context = await getSessionNotesContext(debugSessionId)

    return res.status(200).json(context ?? { notes: [], sketches: [] })
  } catch (err) {
    return next(err)
  }
}
