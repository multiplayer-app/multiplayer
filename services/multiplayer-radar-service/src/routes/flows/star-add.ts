import type { Request, Response, NextFunction } from 'express'
import { FlowMetadataModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const flowId = req.params.flowId as string

    const { starId } = req.body

    const flowMetadata = await FlowMetadataModel.addFlowMetadataStarById(
      workspaceId,
      projectId,
      flowId,
      starId,
    )

    return res.status(200).json(flowMetadata)
  } catch (err) {
    return next(err)
  }
}
