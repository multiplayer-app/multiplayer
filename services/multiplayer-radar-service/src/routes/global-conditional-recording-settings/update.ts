import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'
import { ConditionalRecordingFiltersService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string

    const payload = req.body

    const sessionRecordingConditions = await ProjectModel.updateConditionalRecordingSettings(
      projectId,
      payload,
    )

    await ConditionalRecordingFiltersService.invalidateConditionalRecordingSettings(projectId)

    return res.status(200).json(sessionRecordingConditions)
  } catch (err) {
    return next(err)
  }
}
