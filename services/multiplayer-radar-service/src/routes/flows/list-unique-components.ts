import type { Request, Response, NextFunction } from 'express'
import { FlowService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string


    const componentNames = await FlowService.listUniqueComponentsFromFlows({
      workspaceId,
      projectId,
    })

    const data = {
      componentNames,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
