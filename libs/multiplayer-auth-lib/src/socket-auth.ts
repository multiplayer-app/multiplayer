import { EventEmitter } from 'events'
import express from 'express'
import {
  RoleAccessAction, FeatureFlag,
  SocketIOError,
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity,
  // IIntegrationApiKeyJwtPaylaod,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
// import {
//   ATTR_MULTIPLAYER_SESSION_CLIENT_ID,
// } from '@multiplayer-app/session-recorder-node'
import { RestError, HttpError } from 'restify-errors'
import cookieParser from 'cookie-parser'
import { expressSession } from './session'
import authorize from './authorize'

// import { MultiplayerSession } from './access-control/types/request.type'
// import {
//   AUTH_HEADER_NAME,
//   CURRENT_USER_HEADER_NAME,
// } from './config'

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
  return statusCode
    ? parseInt(statusCode as string, 10)
    : 500
}

const authWrap = (middleware, reqParams?: Record<string, string>) => (socket, next) => {
  const req = socket.request as express.Request

  const _headers = Object.fromEntries(
    Object.entries(socket?.handshake?.auth || {})
      .map(([key, value]) => ([key.toLowerCase(), value])),
  ) as any

  req.headers = {
    ...(req.headers || {}),
    ...(_headers),
  }

  req.params = reqParams || {}
  req.query = req?.query || {}

  const res = new EventEmitter() as unknown as express.Response

  return middleware(req, res, (err: HttpError) => {
    if (err) {
      logger.error(err)

      let statusCode = getStatusCodeFromResponse(err)
      let message = 'An error occurred. We are looking into it.'
      // let status = 'InternalServerError'

      if (
        err instanceof RestError
        || err instanceof HttpError
      ) {
        statusCode = err.statusCode
        message = err.message
        // status = err.code
      }

      return next(new SocketIOError(
        message,
        statusCode,
      ))
    }

    return next()
  })
}

export const socketCookieParser = authWrap(cookieParser())
export const socketExpressSession = authWrap(expressSession())
export const socketAuthorize = (params: {
  entity?: RoleWorkspacePermissionEntity | RoleProjectPermissionEntity,
  action?: RoleAccessAction,
  onlyEnabled?: boolean,
  onlySuperadmin?: boolean,
  featureFlag?: FeatureFlag,
} = {}, reqParams?: Record<string, string>) => authWrap(authorize(params), reqParams)
