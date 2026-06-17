import * as redis from '@multiplayer/redis'

export { default as authorize } from './authorize'
export { default as authorizeInternal } from './authorize-internal'
export * from './access-control/types/request.type'
export * as Config from './config'
export {
  sessionMiddleware,
  expressSession,
  createSession,
  cookieOptions,
} from './session'
export * as AccessControl from './access-control'
export * as AccessControlContext from './access-control/context'
export * as AccessControlEntities from './access-control/entities'
export * as AccessControlRoleUtil from './access-control/role'
export * as UserSessionHelper from './helpers/user-session.helper'
export {
  socketCookieParser,
  socketExpressSession,
  socketAuthorize,
} from './socket-auth'
redis.connect()
