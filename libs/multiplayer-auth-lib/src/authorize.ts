import {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from 'express'
import { ObjectId } from '@multiplayer/mongo'
import { TokenModel, IUserDocument } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { JwtToken, RandomToken } from '@multiplayer/util'
import {
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
  RoleAccountPermissionEntity,
  RoleAccessAction,
  ErrorMessage,
  FeatureFlag, TokenTypeEnum,
} from '@multiplayer/types'
import {
  UnauthorizedError,
  ForbiddenError,
} from 'restify-errors'
import {
  checkFeatureFlag,
  checkPermissions,
} from './access-control'
import {
  IntegrationHelper,
  UserHelper,
  AccessHelper,
} from './helpers'
import {
  AUTH_HEADER_NAME,
  CURRENT_USER_HEADER_NAME,
  INTEGRATION_JWT_SECRET,
  OAUTH_HEADER_NAME,
} from './config'

const authorize = ({
  onlyEnabled = true,
  onlySuperadmin = false,
}) => {
  const authorizeMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.isInternal) {
        return next()
      }

      const apiKey = req.headers[AUTH_HEADER_NAME] as string | undefined
      const tokenHeader = req.headers[OAUTH_HEADER_NAME] as string | undefined
      const oauthToken = tokenHeader && (tokenHeader.startsWith('Bearer ') || tokenHeader.startsWith('bearer '))
        ? tokenHeader.slice(7).trim()
        : null

      if (oauthToken) {
        const token = await TokenModel.findByToken(RandomToken.hashToken(oauthToken))

        if (
          !token
          || !token.user
          || token.type !== TokenTypeEnum.OAUTH_ACCESS_TOKEN
        ) {
          return next(new UnauthorizedError(ErrorMessage.AUTH_FAILED))
        }
        const user = await UserHelper.findById(token.user.toString())

        if (!user) {
          return next(new UnauthorizedError(ErrorMessage.AUTH_FAILED))
        }

        if (onlySuperadmin && !user.superAdmin) {
          return next(new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED))
        }

        if (onlyEnabled && !user.enabled) {
          return next(new ForbiddenError(ErrorMessage.NOT_ENABLED))
        }
        req.session.current = user._id.toString()
        req.session.users = [user._id.toString()]
        req.user = user
        req.rawToken = token
        return next()
      } else if (apiKey) {
        const decodedApiKey = JwtToken.decodeJwtToken(apiKey, INTEGRATION_JWT_SECRET)

        req.rawApiKeyPayload = decodedApiKey

        if (decodedApiKey.integration) {
          const integration = await IntegrationHelper.findById(decodedApiKey.integration)

          if (!integration) {
            return next(new UnauthorizedError(ErrorMessage.AUTH_FAILED))
          }

          req.integration = integration
        }

        return next()
      } else {
        const session = req.session // to delete
        const headerUserId = req.headers[CURRENT_USER_HEADER_NAME] as string | undefined
        const currentUserId = headerUserId || session.current

        if (currentUserId && req.session.users?.includes(currentUserId)) {
          // Fallback to session-based authentication
          const user = await UserHelper.findById(currentUserId)
          if (!user) {
            return next(new UnauthorizedError(ErrorMessage.AUTH_FAILED))
          }
          session.current = currentUserId
          req.user = user
        } else {
          // Try guest access
          const { workspaceId, projectId } = req.params

          const access = await AccessHelper.get({
            workspaceId: workspaceId as string | undefined,
            projectId: projectId as string | undefined,
          })

          if (access?.guest?.enabled) {
            req.user = {
              _id: new ObjectId(),
              firstName: 'First Name',
              lastName: 'Last Name',
              primaryEmail: 'random@mail.com',
              enabled: true,
              guest: true,
            } as unknown as IUserDocument
          } else {
            return next(new UnauthorizedError(ErrorMessage.AUTH_FAILED))
          }
        }

        if (onlySuperadmin && !req.user.superAdmin) {
          return next(new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED))
        }

        if (onlyEnabled && !req.user.enabled) {
          return next(new ForbiddenError(ErrorMessage.NOT_ENABLED))
        }

        return next()
      }
    } catch (err) {
      logger.error(err)
      return next(new UnauthorizedError())
    }
  }
  return authorizeMiddleware
}

const authorizeRouter = ({
  onlyEnabled = true,
  onlySuperadmin,
  entity,
  action,
  featureFlag,
  bulk,
  overrideIdPath,
}: {
  entity?: RoleWorkspacePermissionEntity | RoleProjectPermissionEntity | RoleAccountPermissionEntity,
  action?: RoleAccessAction,
  featureFlag?: FeatureFlag,
  onlyEnabled?: boolean,
  onlySuperadmin?: boolean
  /**
   * @description ignores _id for DELETE and UPDATE actions
   */
  bulk?: boolean,
  overrideIdPath?: string
} = {}): Router => {
  const router = Router({ mergeParams: true })
  router.use(authorize({ onlyEnabled, onlySuperadmin }))
  router.use(checkFeatureFlag(featureFlag))
  router.use(checkPermissions({ entity, action, bulk, overrideIdPath }))

  return router
}

export default authorizeRouter
