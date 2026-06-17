import type { Request, Response, NextFunction } from 'express'
import * as AgentService from '../../services/agent.service'

export const bulkUpdateChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const { filter, payload } = req.body

    const chats = await AgentService.bulkUpdateAgentChats(workspaceId, projectId, filter, payload)

    return res.status(200).json(chats)
  } catch (err) {
    return next(err)
  }
}
