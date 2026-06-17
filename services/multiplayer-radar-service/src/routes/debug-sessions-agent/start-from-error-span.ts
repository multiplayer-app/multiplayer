import type { Request, Response, NextFunction } from 'express'
import {
  MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX,
  MULTIPLAYER_TRACE_CLIENT_ID_LENGTH,
  ATTR_MULTIPLAYER_SESSION_CLIENT_ID,
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_INTEGRATION_ID,
} from '@multiplayer-app/session-recorder-node'
import { InvalidArgumentError } from 'restify-errors'
import {
  OtlpLib,
} from '../../libs'
import {
  IssueService,
} from '../../services'
import { ISpan } from '../../types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req?.rawApiKeyPayload?.workspace || req?.body?.workspace
    const project = req?.rawApiKeyPayload?.project || req?.body?.project
    const integrationId = req?.rawApiKeyPayload?.integration || req?.body?.integration
    const rawSpan = req.body.span as ISpan

    if (!workspace || !project || !integrationId) {
      throw new InvalidArgumentError()
    }

    const clientId = (rawSpan.traceId as string).substring(
      MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX.length,
      MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX.length +
      MULTIPLAYER_TRACE_CLIENT_ID_LENGTH * 2,
    )

    rawSpan.attributes[ATTR_MULTIPLAYER_SESSION_CLIENT_ID] = clientId
    rawSpan.attributes[ATTR_MULTIPLAYER_WORKSPACE_ID] = workspace
    rawSpan.attributes[ATTR_MULTIPLAYER_PROJECT_ID] = project
    rawSpan.attributes[ATTR_MULTIPLAYER_INTEGRATION_ID] = integrationId

    const traceRequest = {
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [rawSpan],
            },
          ],
        },
      ],
    }

    const [span] = OtlpLib.convertExportTraceToCh(traceRequest)

    if (!span.TraceId.startsWith(MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX)) {
      throw new InvalidArgumentError('Span is not a session cache span')
    }

    if (!OtlpLib.isErrorSpan(span)) {
      throw new InvalidArgumentError('Span is not an error span')
    }

    const issueContext = await IssueService.handleIssueInTraceRequest(traceRequest, true)

    if (!issueContext.debugSession) {
      return res.sendStatus(204)
    }

    return res.status(200).json({
      _id: issueContext.debugSession._id.toString(),
      url: issueContext.debugSession.url,
    })
  } catch (err) {
    return next(err)
  }
}
