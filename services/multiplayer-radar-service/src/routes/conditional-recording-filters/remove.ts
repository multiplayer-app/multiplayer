import type { Request, Response, NextFunction } from 'express'
import { ConditionalRecordingFiltersModel } from '@multiplayer/models'
import { ConditionalRecordingFiltersService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conditionalRecordingFiltersId = req.params.conditionalRecordingFiltersId as string
    const projectId = req.params.projectId as string

    await ConditionalRecordingFiltersModel.deleteConditionalRecordingFiltersById(conditionalRecordingFiltersId)

    await ConditionalRecordingFiltersService.invalidateConditionalRecordingSettings(projectId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
