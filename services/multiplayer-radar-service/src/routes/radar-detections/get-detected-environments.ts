import type { Request, Response, NextFunction } from 'express'
import { RadarDetectionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string

    const environments = await RadarDetectionService.getRadarDetectedEnvironmentNames({
      workspaceId,
      projectId,
    })

    return res.status(200).json(environments)
  } catch (err) {
    return next(err)
  }
}
