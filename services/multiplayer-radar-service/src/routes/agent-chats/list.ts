import type { Request, Response, NextFunction } from 'express'
import {
  AgentChatModel,
  Config as ModelConfig,
} from '@multiplayer/models'
import { AgentChatStatus } from '@multiplayer/types'

export const listChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string

    const {
      status,
      agentId,
      archived,
      agentName,
      dir,
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : ModelConfig.SKIP
    const limit = 'limit' in req.query ? Number(req.query.limit) : ModelConfig.LIMIT

    const result = await AgentChatModel.findAgentChats(
      {
        workspace: workspaceId,
        project: projectId,
        ...(agentId ? { agent: agentId as string } : {}),
        ...(status ? { status: status as AgentChatStatus } : {}),
        ...(agentName ? { agentName: agentName as string } : {}),
        ...(dir ? { dir: dir as string } : {}),
        archived: archived as any as boolean,
      },
      { skip, limit },
    )

    result.data = result.data.map(chat => {
      (chat as any).id = chat._id

      return chat
    })

    return res.status(200).json(result)
  } catch (err) {
    return next(err)
  }
}
