import type { Request, Response, NextFunction } from 'express'
import { AlertRuleModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertRuleId = req.params.alertRuleId as string

    const alertRule = await AlertRuleModel.findAlertRuleById(alertRuleId)

    if (!alertRule) {
      throw new NotFoundError(ErrorMessage.ALERT_RULE_NOT_FOUND)
    }

    const alertRuleObject = alertRule.toObject()

    return res.status(200).json(alertRuleObject)
  } catch (err) {
    return next(err)
  }
}
