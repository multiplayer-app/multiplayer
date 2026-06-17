import type { Request, Response, NextFunction } from 'express'
import { AlertRuleModel } from '@multiplayer/models'
import {
  IAlertRule,
  ErrorMessage,
} from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { AlertService } from '../../services'
import { issue, span, debugSession } from '../../constants/test-action-data'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const alertRuleId = req.params.alertRuleId as string

    const alertRule = await AlertRuleModel.findAlertRuleById(alertRuleId)

    if (!alertRule) {
      throw new NotFoundError(ErrorMessage.ALERT_RULE_NOT_FOUND)
    }

    const alertRuleObject = alertRule.toObject()

    const actionPayload = req.body as IAlertRule['actions'][0]

    try {
      await AlertService.sendAlert(
        workspaceId,
        projectId,
        {
          issue,
          span,
          sessionRecording: debugSession,
          conditionType: alertRuleObject.conditions[0].type,
        },
        true,
        {
          ...alertRuleObject,
          actions: [actionPayload],
        } as any as IAlertRule,
      )
    } catch (err: any) {
      return res.status(502).json({
        statusCode: 502,
        message: `Failed to send alert. ${err?.error?.message}`,
        status: 'InternalServerError',
      })
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
