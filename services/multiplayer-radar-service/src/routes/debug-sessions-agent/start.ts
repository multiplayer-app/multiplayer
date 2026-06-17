import type { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import {
  MetricsService,
  DebugSessionService,
} from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name = '',
      sessionAttributes,
      resourceAttributes,
      userAttributes,
      tags,

      // backwards compatibility
      metadata,
      clientMetadata,
      userMetadata,
    } = req.body

    const workspace = req?.rawApiKeyPayload?.workspace || req?.body?.workspace
    const project = req?.rawApiKeyPayload?.project || req?.body?.project

    if (!workspace || !project) {
      throw new InvalidArgumentError()
    }

    const debugSession = await DebugSessionService.createManualDebugSession(
      workspace,
      project,
      {
        name,
        sessionAttributes,
        resourceAttributes,
        userAttributes,
        tags,

        metadata,
        clientMetadata,
        userMetadata,
      },
    )

    if (debugSession.endUserHash) {
      await MetricsService.createSessionRecordingRateMetric(
        workspace,
        project,
        debugSession.endUserHash,
        debugSession._id.toString(),
      )
    }

    return res.status(200).json(debugSession)
  } catch (err) {
    return next(err)
  }
}
