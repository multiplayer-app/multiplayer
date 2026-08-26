import type { Request, Response, NextFunction } from 'express'
import { GetEntityStateResponse } from '@multiplayer/types'
import { getYjsEntitiesSocketIO } from '../../yjs/entity-state.holder'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      workspaceId,
      projectId,
      branchId,
      entityId,
    } = req.params as Record<string, string>

    const state = await getYjsEntitiesSocketIO().getEntityState({
      workspaceId,
      projectId,
      branchId,
      entityId,
    })

    const response: GetEntityStateResponse = { state: Object.values(state) }

    return res.status(200).json(response)
  } catch (err) {
    return next(err)
  }
}
