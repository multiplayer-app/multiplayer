import type { Request, Response, NextFunction } from 'express'
import { AgentModel } from '@multiplayer/models'
import { AgentType } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      sortDirection: _sortDirection,
      sortKey: _sortKey,
      type: _type,
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = Number(_sortDirection)
    const sortKey = _sortKey as string
    const type = _type as AgentType | undefined

    const agents = await AgentModel.findAgents({
      workspace: workspaceId,
      project: projectId,
      ...(type ? { type } : {}),
    }, {
      skip,
      limit,
    }, {
      sortKey,
      sortDirection,
    })

    return res.status(200).json(agents)
  } catch (err) {
    return next(err)
  }
}
