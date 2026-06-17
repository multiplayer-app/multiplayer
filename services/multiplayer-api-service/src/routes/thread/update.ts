import type { Request, Response, NextFunction } from 'express'
import { ThreadModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const threadId = req.params.threadId as string
    const {
      status,
      commentablePath,
      position,
    } = req.body

    const payload = {
      status,
      commentablePath,
      position,
    }

    Object.keys(payload)
      .forEach(key => payload[key] === undefined && delete payload[key])

    const thread = await ThreadModel.updateThreadById(threadId, payload)

    return res.status(200).json(thread)
  } catch (err) {
    return next(err)
  }
}
