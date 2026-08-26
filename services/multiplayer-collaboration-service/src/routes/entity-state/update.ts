import type { Request, Response, NextFunction } from 'express'
import { getYjsEntitiesSocketIO } from '../../yjs/entity-state.holder'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      workspaceId,
      projectId,
      branchId,
      entityId,
    } = req.params as Record<string, string>
    const {
      state,
      workspaceUserId,
      entityType,
    } = req.body

    await getYjsEntitiesSocketIO().updateEntityStateAndCommit({
      workspaceId,
      projectId,
      branchId,
      entityId,
      state,
      workspaceUserId,
      entityType,
    })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
