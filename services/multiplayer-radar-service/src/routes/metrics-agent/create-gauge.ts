import type { Request, Response, NextFunction } from 'express'
import {
  IEndUserAttributes,
  MetricName,
} from '@multiplayer/types'
import {
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_USER_HASH,
} from '@multiplayer-app/session-recorder-node'
import { InvalidArgumentError } from 'restify-errors'
import { EndUserModel } from '@multiplayer/models'
import { MetricsService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req?.rawApiKeyPayload?.workspace || req?.body?.workspace
    const project = req?.rawApiKeyPayload?.project || req?.body?.project

    if (!workspace || !project) {
      throw new InvalidArgumentError()
    }

    const payload = req.body as Array<{
      userAttributes: IEndUserAttributes
      MetricName: MetricName
      Attributes: Record<string, string>,
      Value: number,
    }>

    await MetricsService.createMetrics(payload.map(_payload => ({
      MetricName: _payload.MetricName,
      MetricUnit: '1',
      Attributes: {
        ...(_payload.Attributes || {}),
        [ATTR_MULTIPLAYER_WORKSPACE_ID]: workspace,
        [ATTR_MULTIPLAYER_PROJECT_ID]: project,
        [ATTR_MULTIPLAYER_USER_HASH]: EndUserModel.getEndUserHash({
          workspace,
          project,
          attributes: _payload.userAttributes,
        }),
      },
      Value: _payload.Value,
      StartTimeUnix: new Date().toISOString(),
      TimeUnix: new Date().toISOString(),
    })))

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
