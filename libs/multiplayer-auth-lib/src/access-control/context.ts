import type { Request } from 'express'
import {
  IntegrationModel,
  ProjectModel,
  EntityModel,
  WorkspaceModel,
  ITokenDocument,
} from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import logger from '@multiplayer/logger'
import {
  IIntegrationApiKeyJwtPaylaod,
  ObjectTypeEnum,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  TokenTypeEnum,
  ErrorMessage,
  OauthTokenType,
} from '@multiplayer/types'
import { ForbiddenError } from 'restify-errors'
import type { Context } from './types/context'
import {
  getProjectAdminRole,
  getWorkspaceOwnerRole,
} from './role'
import {
  AUTH_HEADER_NAME,
  CURRENT_USER_HEADER_NAME,
} from '../config'
import {
  AccessHelper,
  UserSessionHelper,
  WorkspaceUserHelper,
} from '../helpers'
import {
  ContextCache,
  UserSessionCache,
} from '../cache'

export const buildGuestContext = async (
  workspaceId: string,
  projectId: string,
): Promise<Context> => {
  const access = await AccessHelper.get({ workspaceId, projectId })

  if (!access) {
    logger.error(
      {
        workspaceId,
        projectId,
      },
      '[ACCESS] Missing access',
    )
    throw new ForbiddenError('Missing access')
  }

  return {
    guest: true,
    workspaceOwner: false,
    workspaceAdmin: false,
    superAdmin: false,
    workspaceRoleId: '',
    workspaceId: workspaceId,
    projects: [{
      projectId: projectId,
      projectRoleIds: [access.guest.role],
    }],
    teams: [],
    objects: [],
  } as Context
}

export const buildUserContext = async (
  userId: string | ObjectId,
  workspaceId: string,
): Promise<Context> => {
  const [userSession] = await UserSessionHelper.get(
    [userId],
    [workspaceId],
  )

  if (!userSession) {
    logger.error(
      {
        userId,
      },
      '[ACCESS] Missing context',
    )
    throw new ForbiddenError(ErrorMessage.NO_ACCESS_TO_THE_RESOURCE)
  }

  const workspace = userSession?.workspaces
    ?.find(workspaceCtx => workspaceCtx._id?.toString() === workspaceId)

  if (!workspace?.user) {
    throw new ForbiddenError(ErrorMessage.NO_ACCESS_TO_THE_RESOURCE)
  }

  const workspaceUserId = workspace.user?.workspaceUser?.toString()
  const workspaceRoleId = workspace.user?.role?.toString()
  const workspaceOwner = !!workspace.user?.workspaceOwner
  const workspaceAdmin = !!workspace.user?.workspaceAdmin

  const projectsMapping = new Map<
  string,
  {
    projectId: string,
    projectRoleIds: Set<string>
  }>()
  const teams: {
    teamId: string
    projects: string[]
    projectRoleId: string
  }[] = []

  const workspaceSettings = await WorkspaceModel.getWorkspaceSettings(workspaceId)

  if (workspaceOwner || workspaceAdmin) {
    const _projects = await ProjectModel.getProjectIdsInWorkspace(workspaceId)

    for (let projectIndex = 0; projectIndex < _projects.length; projectIndex++) {
      const projectId = _projects[projectIndex]?._id?.toString()

      if (!projectId) {
        continue
      }

      projectsMapping.set(projectId, {
        projectId,
        projectRoleIds: new Set(),
      })
    }
  } else {
    for (let teamIndex = 0; teamIndex < workspace.teams.length; teamIndex++) {
      const team = workspace.teams[teamIndex]
      const projectRoleId = team.role

      if (!projectRoleId) {
        logger.warn(
          {
            userId,
            teamId: team._id,
          },
          '[ACCESS] Skipping team with missing role while building access context',
        )

        continue
      }

      teams.push({
        teamId: team._id.toString(),
        projects: team.projects.map(projectId => projectId.toString()),
        projectRoleId: projectRoleId.toString(),
      })

      for (let projectIndex = 0; projectIndex < team.projects.length; projectIndex++) {
        const projectId = team.projects[projectIndex]?.toString()

        if (!projectId) {
          continue
        }

        projectsMapping.set(projectId, {
          projectId,
          projectRoleIds: new Set([
            ...(projectsMapping.get(projectId)?.projectRoleIds || []),
            projectRoleId.toString(),
          ]),
        })
      }
    }

    for (let projectIndex = 0; projectIndex < workspace.projects.length; projectIndex++) {
      const projectId = workspace.projects[projectIndex]?._id?.toString()
      const projectRoleId = workspace.projects[projectIndex]?.role?.toString()

      if (!projectId || !projectRoleId) {
        continue
      }

      projectsMapping.set(projectId, {
        projectId: projectId.toString(),
        projectRoleIds: new Set([
          ...(projectsMapping.get(projectId)?.projectRoleIds || []),
          projectRoleId.toString(),
        ]),
      })
    }

    if (workspaceSettings?.memberProjectAccess?.enabled !== false) {
      const defaultRoleId = workspaceSettings?.memberProjectAccess?.projectRoleId
      const allProjects = await ProjectModel.getProjectIdsInWorkspace(workspaceId)

      for (let projectIndex = 0; projectIndex < allProjects.length; projectIndex++) {
        const projectId = allProjects[projectIndex]?._id?.toString()

        if (!projectId || projectsMapping.has(projectId)) {
          continue
        }

        projectsMapping.set(projectId, {
          projectId,
          projectRoleIds: new Set(defaultRoleId ? [defaultRoleId.toString()] : []),
        })
      }
    }
  }

  const projects = Array.from(projectsMapping.values()).map(_project => ({
    projectId: _project.projectId,
    projectRoleIds: [..._project.projectRoleIds],
  }))

  const context = {
    userId: userId.toString(),
    workspaceOwner,
    workspaceAdmin,
    superAdmin: userSession.superAdmin,
    workspaceUserId,
    workspaceRoleId,
    workspaceId: workspaceId.toString(),
    projects,
    teams,
  } as Context

  return context
}

export const buildApiKeyContext = async (
  apiKey: string,
  apiKeyPayload: IIntegrationApiKeyJwtPaylaod,
  workspaceId: string,
): Promise<Context> => {

  if (apiKeyPayload?.integration) {
    const integration = await IntegrationModel.findIntegrationByIdAndType(
      apiKeyPayload.integration,
      apiKeyPayload.type,
    )

    if (
      !integration
      || !(integration.workspace as ObjectId).equals(workspaceId)) {
      logger.error(
        {
          integrationWorkspaceId: integration?.workspace?.toString(),
          apiKey,
          apiKeyPayload,
        },
        '[ACCESS] No access to workspace',
      )
      throw new ForbiddenError('No access to workspace')
    }

    return {
      integrationId: integration._id.toString(),
      workspaceOwner: false,
      workspaceAdmin: false,
      superAdmin: false,
      workspaceRoleId: integration.workspaceRole?.toString(),
      workspaceId: workspaceId.toString(),
      projects: [{
        projectId: integration.project?.toString(),
        projectRoleIds: [integration.projectRole?.toString()],
      }],
      teams: [],
      objects: [],
    } as Context
  } else if (
    apiKeyPayload.objectId
    && apiKeyPayload.objectType
    && apiKeyPayload.type
  ) {
    let object

    if (apiKeyPayload.objectType === ObjectTypeEnum.ENTITY) {
      object = await EntityModel.findEntityByPublicShareToken(
        apiKeyPayload.workspace,
        apiKeyPayload.project,
        apiKeyPayload.objectId,
      )
    }

    if (!object) {
      throw new ForbiddenError('No access to entity')
    }

    return {
      workspaceOwner: false,
      workspaceAdmin: false,
      superAdmin: false,
      // workspaceRoleId: integration.workspaceRole?.toString(),
      workspaceId: workspaceId.toString(),
      projects: [{
        projectId: apiKeyPayload.project?.toString(),
        projectRoleIds: [],
      }],
      teams: [],
      objects: [{
        objectId: apiKeyPayload.objectId,
        objectType: apiKeyPayload.objectType,
        publicShareRoleIds: [object.access.publicLink.role],
      }],
    } as Context
  }

  throw new ForbiddenError('Invalid api key')
}

export const buildTokenContext = async (
  token: ITokenDocument,
  workspaceId: string,
): Promise<Context> => {
  if (token.type !== TokenTypeEnum.OAUTH_ACCESS_TOKEN || !token.user) {
    throw new ForbiddenError('Invalid api key')
  }

  if (token.meta.workspace && token.meta.workspace.toString() !== workspaceId) {
    throw new ForbiddenError('No access to workspace')
  }

  const userContext = await buildUserContext(token.user.toString(), workspaceId)
  if (token.meta.oauthTokenType === OauthTokenType.PERSONAL) {
    return {
      workspaceOwner: false,
      workspaceAdmin: false,
      superAdmin: false,
      workspaceId: userContext.workspaceId,
      projects: userContext.projects.map(({ projectId, projectRoleIds }) => ({
        projectId,
        projectRoleIds, //todo: update to readonly
      })),
      teams: [],
      objects: [],
    }
  }

  if (!token.meta.workspace ||
    !token.meta.project ||
    !userContext.projects.find(({ projectId }) => token.meta.project?.toString() === projectId)) {
    throw new ForbiddenError('Invalid api key')
  }

  return {
    workspaceOwner: false,
    workspaceAdmin: false,
    superAdmin: false,
    workspaceId: token.meta.workspace.toString(),
    projects: [{
      projectId: token.meta.project.toString(),
      projectRoleIds: [],
    }],
    teams: [],
    objects: [],
    scopes: (token.meta.scopes || []).reduce((acc, scope) => {
      const data = scope.split(':')
      if (data.length === 2) {
        acc[data[0] as RoleProjectPermissionEntity] = acc[data[0]] || []
        acc[data[0]].push(data[1] as RoleAccessAction)
      }
      return acc
    }, {} as Partial<Record<RoleProjectPermissionEntity, RoleAccessAction[]>>),
  }
}

export const setAccessContextToReq = async (req: Request) => {
  const userId = req.user?._id?.toString() || (req.headers[CURRENT_USER_HEADER_NAME] as string | undefined)
  const apiKey = req.headers[AUTH_HEADER_NAME] as string | undefined

  const rawApiKeyPayload = req.rawApiKeyPayload
  const token = req.rawToken
  const accountId = req.params.accountId as string | undefined
  const projectId = req.params.projectId as string | undefined
  const workspaceId: string | undefined = req.params.workspaceId
    || (req.query.workspace as string)
    // workspace id from oauth callback
    || req?.oauthState?.workspace
    || req?.session?.[req?.oauthStateSessionPath || '']?.state?.state?.workspace

  if (
    (accountId && !workspaceId)
    || (!accountId && !workspaceId)
  ) {
    req.context = {
      userId,
      workspaceId: '',
      workspaceRoleId: '',
      teams: [],
      projects: [],
      objects: [],
    }
    return
  }

  if (!workspaceId) {
    logger.error('[ACCESS] Missing workspace id in request')
    throw new ForbiddenError('Invalid auth context')
  }

  if (req.user?.superAdmin) {
    const workspaceOwnerRole = getWorkspaceOwnerRole()

    if (!workspaceOwnerRole) {
      logger.error('[ACCESS] Workspace owner role not found in memory')
      throw new ForbiddenError('Failed to build access context')
    }

    const workspaceUserId = await WorkspaceUserHelper.getWorkspaceUserId(
      userId as string,
      workspaceId,
    )
    req.context = {
      userId,
      workspaceOwner: false,
      workspaceAdmin: false,
      workspaceUserId,
      superAdmin: true,
      workspaceId,
      workspaceRoleId: workspaceOwnerRole._id.toString(),
      teams: [],
      projects: [],
      objects: [],
    }

    return
  }

  if (!workspaceId) {
    logger.error('[ACCESS] Failed to get workspace id')
    throw new ForbiddenError('No access to workspace')
  }

  let context: Context | undefined

  if (userId) {
    if (req.user?.guest && projectId) {
      context = await ContextCache.get({
        workspaceId,
        userId: 'guest',
      })

      if (!context) {
        context = await buildGuestContext(
          workspaceId,
          projectId,
        )

        await ContextCache.set(
          {
            workspaceId,
            userId: 'guest',
          },
          context,
        )
      }
    } else {
      context = await ContextCache.get({
        workspaceId,
        userId,
      })

      if (!context) {
        try {
          context = await buildUserContext(userId, workspaceId)

          await ContextCache.set(
            {
              workspaceId,
              userId,
            },
            context,
          )
        } catch (error: any) {
          if (
            error?.message === ErrorMessage.NO_ACCESS_TO_THE_RESOURCE
            && workspaceId
            && projectId
            && ((await AccessHelper.get({
              workspaceId,
              projectId,
            }))?.guest.enabled)
          ) {
            context = (await buildGuestContext(
              workspaceId,
              projectId,
            ) as Context)

            await ContextCache.set(
              {
                workspaceId,
                userId: 'guest',
              },
              context,
            )
          } else {
            throw error
          }
        }
      }
    }
  } else if (apiKey) {
    context = await ContextCache.get({
      workspaceId,
      userId: apiKey,
    })

    if (!context) {
      context = await buildApiKeyContext(
        apiKey,
        rawApiKeyPayload,
        workspaceId,
      )

      await ContextCache.set(
        {
          workspaceId,
          userId: apiKey,
        },
        context,
      )
    }
  } else if (token) {
    context = await ContextCache.get({
      workspaceId,
      userId: token.token,
    })

    if (!context) {
      context = await buildTokenContext(
        token,
        workspaceId,
      )

      await ContextCache.set(
        {
          workspaceId,
          userId: token.token,
        },
        context,
      )
    }
  } else {
    logger.debug('[ACCESS] No logged in users in sessions')
    throw new ForbiddenError('No active sessions')
  }

  req.context = context
}


export const invalidateContext = async ({
  userId,
  workspaceId,
}: {
  userId?: string,
  workspaceId?: string
}) => {
  if (!userId && !workspaceId) {
    throw new Error('Invalid filter for session invalidation')
  }

  // const key = `${ACCESS_CONTEXT_KEY_PREFIX}:${workspaceId || '*'}:${userId || '*'}`

  logger.debug({
    userId,
    workspaceId,
  }, '[ACCESS] Invalidating access context')

  const promises = [
    ContextCache.del({
      userId,
      workspaceId,
    }),
  ]

  if (workspaceId) {
    UserSessionCache.del()
  } else if (userId) {
    promises.push(UserSessionCache.del(userId))
  }

  await Promise.all(promises)
}
