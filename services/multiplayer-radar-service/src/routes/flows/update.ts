import type { Request, Response, NextFunction } from 'express'
import { FlowMetadataModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const flowId = req.params.flowId as string

    const payload = req.body

    const flowMetadata = await FlowMetadataModel.updateFlowMetadataById(
      workspaceId,
      projectId,
      flowId,
      payload,
    )

    return res.status(200).json(flowMetadata)
  } catch (err) {
    return next(err)
  }
}
