import type { Request, Response, NextFunction } from 'express'
import { ConditionalRecordingFiltersModel } from '@multiplayer/models'
import { ConditionalRecordingFiltersService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const conditionalRecordingFiltersId = req.params.conditionalRecordingFiltersId as string

    const payload = req.body

    const sessionRecordingConditions = await ConditionalRecordingFiltersModel.updateConditionalRecordingFiltersById(
      workspaceId,
      projectId,
      conditionalRecordingFiltersId,
      payload,
    )

    await ConditionalRecordingFiltersService.invalidateConditionalRecordingSettings(projectId)

    return res.status(200).json(sessionRecordingConditions)
  } catch (err) {
    return next(err)
  }
}
