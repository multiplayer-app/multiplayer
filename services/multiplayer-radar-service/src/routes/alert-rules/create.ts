import type { Request, Response, NextFunction } from 'express'
import { AlertRuleModel } from '@multiplayer/models'
import { AlertRulesCache } from '../../cache'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string

    const payload = {
      workspace: workspaceId,
      project: projectId,
      ...req.body,
    }

    const alertRule = await AlertRuleModel.createAlertRule(payload)

    await AlertRulesCache.del(projectId)

    return res.status(200).json(alertRule)
  } catch (err) {
    return next(err)
  }
}
