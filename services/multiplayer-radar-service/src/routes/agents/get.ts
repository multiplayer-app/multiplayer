import type { Request, Response, NextFunction } from 'express'
import { AgentModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const agentId = req.params.agentId as string


    const agent = await AgentModel.findAgentByIdAndProjectAndWorkspace(
      agentId,
      projectId,
      workspaceId,
    )

    if (!agent) {
      throw new NotFoundError(ErrorMessage.AGENT_NOT_FOUND)
    }

    return res.status(200).json(agent.toObject())
  } catch (err) {
    return next(err)
  }
}
