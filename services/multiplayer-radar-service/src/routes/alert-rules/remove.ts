import type { Request, Response, NextFunction } from 'express'
import { AlertRuleModel } from '@multiplayer/models'
import { AlertRulesCache } from '../../cache'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const alertRuleId = req.params.alertRuleId as string

    await AlertRuleModel.deleteAlertRuleById(workspaceId, projectId, alertRuleId)

    await AlertRulesCache.del(projectId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
