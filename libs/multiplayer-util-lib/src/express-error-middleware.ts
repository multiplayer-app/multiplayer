import logger from '@multiplayer/logger'
import { SessionRecorderSdk } from '@multiplayer-app/session-recorder-common'
import restify from 'restify-errors'
import type { Request, Response, NextFunction } from 'express'

const { RestError, HttpError } = restify

interface MiddlewareError extends Error {
  status?: number | string;
  statusCode?: number | string;
  status_code?: number | string;
  output?: {
    statusCode?: number | string;
  };
}

function getStatusCodeFromResponse(error: MiddlewareError): number {
  const statusCode = error.status || error.statusCode || error.status_code || error.output?.statusCode
  return statusCode ? parseInt(statusCode as string, 10) : 500
}

// eslint-disable-next-line
// @ts-ignore
export default (err: Error | restify, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    logger.error(err)
  }

  let statusCode = getStatusCodeFromResponse(err)
  let message = 'An error occurred. We are looking into it.'
  let status = 'InternalServerError'

  if (
    err instanceof RestError
    || err instanceof HttpError
  ) {
    statusCode = err.statusCode
    message = err.message
    status = err.code
  }

  SessionRecorderSdk.captureException(err)

  return res.status(statusCode).json({
    statusCode,
    message,
    status,
  })
}
