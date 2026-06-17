import type { Request, Response, NextFunction } from 'express'
import { FlowMetadataModel } from '@multiplayer/models'
import { FlowService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const flowId = req.params.flowId as string

    const [
      flowMetadata,
      flow,
    ] = await Promise.all([
      FlowMetadataModel.findFlowMetadataById(flowId),
      FlowService.getFlowById(flowId),
    ])

    const data = {
      flow,
      metadata: flowMetadata,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
