import type { Request, Response, NextFunction } from 'express'
import { FlowMetadataModel } from '@multiplayer/models'
import { FlowService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string

    const { ids: flowIds } = req.body as { ids?: string[] }

    await Promise.all([
      FlowService.deleteFlows({
        workspaceId,
        projectId,
        id: flowIds,
      }),
      FlowMetadataModel.deleteFlowsMetadataByProject(
        workspaceId,
        projectId,
        flowIds,
      ),
    ])

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
