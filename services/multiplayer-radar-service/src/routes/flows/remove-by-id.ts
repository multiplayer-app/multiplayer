import type { Request, Response, NextFunction } from 'express'
import { FlowMetadataModel } from '@multiplayer/models'
import { FlowService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.flowId as string

    await Promise.all([
      FlowService.deleteFlowById(flowId),
      FlowMetadataModel.deleteFlowMetadataById(flowId),
    ])

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
