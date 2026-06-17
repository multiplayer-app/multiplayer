import type { Request, Response, NextFunction } from 'express'
import * as AgentService from '../../services/agent.service'

export const bulkRemoveChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const filters = req.body

    await AgentService.bulkRemoveAgentChats(workspaceId, projectId, filters)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
