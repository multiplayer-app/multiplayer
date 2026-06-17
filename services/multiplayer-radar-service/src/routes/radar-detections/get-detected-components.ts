import type { Request, Response, NextFunction } from 'express'
import { RadarDetectionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string

    const components = await RadarDetectionService.getDetectedComponents({
      workspaceId,
      projectId,
    })

    return res.status(200).json(components)
  } catch (err) {
    return next(err)
  }
}
