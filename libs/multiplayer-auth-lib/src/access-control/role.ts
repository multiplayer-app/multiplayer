import {
  RoleModel,
  IRoleDocument,
  AccountModel,
  WorkspaceModel,
} from '@multiplayer/models'
import {
  RoleType,
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity,
  RoleAccountPermissionEntity,
  RoleAccessAction,
  ErrorMessage,
  IRole,
} from '@multiplayer/types'
import { mongoose } from '@multiplayer/mongo'
import logger from '@multiplayer/logger'
import { ForbiddenError } from 'restify-errors'
import { Context } from './types/context'

export const roles: {
  [RoleType.WORKSPACE]: IRoleDocument[],
  [RoleType.PROJECT]: IRoleDocument[],
  [RoleType.ACCOUNT]: IRoleDocument[],
  [RoleType.PUBLIC_SHARE]: IRoleDocument[],
} = {
  [RoleType.WORKSPACE]: [],
  [RoleType.PROJECT]: [],
  [RoleType.ACCOUNT]: [],
  [RoleType.PUBLIC_SHARE]: [],
}

export let projectAdminRole: IRoleDocument

export let workspaceOwnerRole: IRoleDocument

const loadRoles = async () => {
  const [
    _workspaceRoles,
    _projectRoles,
    _accountRoles,
    _publicShareRoles,
  ] = await Promise.all([
    RoleModel.getAllRoles(RoleType.WORKSPACE),
    RoleModel.getAllRoles(RoleType.PROJECT),
    RoleModel.getAllRoles(RoleType.ACCOUNT),
    RoleModel.getAllRoles(RoleType.PUBLIC_SHARE),
  ])

  roles[RoleType.WORKSPACE] = _workspaceRoles
  roles[RoleType.PROJECT] = _projectRoles
  roles[RoleType.ACCOUNT] = _accountRoles
  roles[RoleType.PUBLIC_SHARE] = _publicShareRoles
}

let loadedRolesTries = 0
mongoose.connection.on('connected', async () => {
  let loadedRoles = false

  while (!loadedRoles && loadedRolesTries < 10) {
    try {
      await loadRoles()
      loadedRoles = true

      logger.info('[ACCESS] Loaded roles into memory')
    } catch (err) {
      logger.error({ err }, '[ACCESS] Error occured on loading roles')
      loadedRolesTries++
    }
  }

  if (loadedRolesTries >= 10) {
    logger.error('[ACCESS] Failed to load roles')
    process.exit(1)
  }
})

export const getWorkspaceEntityAccessActions = async (
  workspaceRoleId: string,
  entity: RoleProjectPermissionEntity | RoleWorkspacePermissionEntity | RoleAccountPermissionEntity,
): Promise<RoleAccessAction[]> => {
  const role = roles[RoleType.WORKSPACE]
    .find(_role => _role?._id.toString() === workspaceRoleId.toString())

  if (!role) {
    logger.error(
      {
        workspaceRoleId,
      },
      '[ACCESS] Workspace role not found in memory',
    )
    throw new ForbiddenError('Workspace role not found')
  }

  const entityPermissions = role.permissions
    .find(({ entity: _entity }) => _entity === entity)

  if (!entityPermissions) {
    throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
  }

  return entityPermissions.access
}

export const getProjectAggregatedAccessActions = (
  projectRoleIds: string[],
  context?: Context,
): IRole => {
  if (
    context?.workspaceAdmin
    || context?.workspaceOwner
    || context?.superAdmin
  ) {
    return {
      _id: '',
      name: 'Admin',
      type: RoleType.PROJECT,
      permissions: Object.values(RoleProjectPermissionEntity).map(entityName => ({
        entity: entityName,
        access: [
          RoleAccessAction.CREATE,
          RoleAccessAction.DELETE,
          RoleAccessAction.READ,
          RoleAccessAction.UPDATE,
          RoleAccessAction.READ_ACCESS,
          RoleAccessAction.UPDATE_ACCESS,
        ],
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const _roles = roles[RoleType.PROJECT]
    .filter(_role => projectRoleIds
      .find(projectRoleId => _role._id.equals(projectRoleId)),
    )

  if (!_roles.length) {
    return {
      _id: '',
      name: '',
      type: RoleType.PROJECT,
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const _role = _roles[0].toObject()

  for (let roleIndex = 1; roleIndex < (_roles?.length || 0); roleIndex++) {
    const projectRole = _roles[roleIndex]

    for (const permission of projectRole.permissions) {
      const entityAccessIndex = _role.permissions
        .findIndex((_permission) => _permission.entity === permission.entity)

      if (entityAccessIndex === -1) {
        _role.permissions.push(permission)
      } else {
        _role.permissions[entityAccessIndex].access = [...new Set([
          ..._role.permissions[entityAccessIndex].access,
          ...permission.access,
        ])]
      }
    }
  }

  return _role
}

export const getProjectAggregatedEntityAccessActions = async (
  projectRoleIds: string[],
  entity: RoleProjectPermissionEntity | RoleWorkspacePermissionEntity | RoleAccountPermissionEntity,
) => {
  const _roles = roles[RoleType.PROJECT]
    .filter(_role => projectRoleIds
      .find(projectRoleId => _role._id.equals(projectRoleId)),
    )

  const access: RoleAccessAction[] = []

  for (let teamRoleIndex = 0; teamRoleIndex < _roles.length; teamRoleIndex++) {
    const teamRole = _roles[teamRoleIndex]
    const entityAccess = teamRole.permissions.find(({ entity: _entity }) => entity === _entity)

    access.push(...(entityAccess?.access || []))
  }

  // access = [...new Set(access)]

  return [...new Set(access)]
}

export const getProjectPublicShareAggregatedEntityAccessActions = async (
  publicShareRoleIds: string[],
  entity: RoleProjectPermissionEntity | RoleWorkspacePermissionEntity | RoleAccountPermissionEntity,
) => {
  const _roles = roles[RoleType.PUBLIC_SHARE]
    .filter(_role => publicShareRoleIds
      .find(publicShareRoleId => _role._id.equals(publicShareRoleId)),
    )

  const access: RoleAccessAction[] = []

  for (let publicShareRoleIndex = 0; publicShareRoleIndex < _roles.length; publicShareRoleIndex++) {
    const publicShareRole = _roles[publicShareRoleIndex]
    const entityAccess = publicShareRole.permissions.find(({ entity: _entity }) => entity === _entity)

    access.push(...(entityAccess?.access || []))
  }

  // access = [...new Set(access)]

  return [...new Set(access)]
}

export const getAccountEntityAccessActions = async (
  accountId: string,
  accountRoleId: string,
  entity: RoleAccountPermissionEntity | RoleProjectPermissionEntity | RoleWorkspacePermissionEntity,
): Promise<RoleAccessAction[]> => {
  const accountRole = roles[RoleType.ACCOUNT]
    .find(_role => _role._id.equals(accountRoleId))

  if (!accountRole) {
    logger.error(
      {
        accountRole,
      },
      '[ACCESS] Role not found in memory',
    )
    throw new ForbiddenError('Account role not found')
  }

  const role = { ...accountRole.toObject() }

  const entityPermissions = role.permissions
    .find(({ entity: _entity }) => _entity === entity)

  if (!entityPermissions) {
    throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
  }

  // const workspacesCount = await WorkspaceModel.countWorkpsacesForAccount(accountId)
  // if (workspacesCount >= 1) {
  //   entityPermissions.access = entityPermissions.access.filter(action => action !== RoleAccessAction.CREATE)
  // }

  return entityPermissions.access
}

export const getProjectAdminRole = () => {
  if (projectAdminRole) {
    return projectAdminRole
  }

  const _teamAdminRole = roles[RoleType.PROJECT]
    .find(role => role.teamAdmin) as IRoleDocument

  projectAdminRole = _teamAdminRole

  return projectAdminRole
}

export const getWorkspaceOwnerRole = () => {
  if (workspaceOwnerRole) {
    return workspaceOwnerRole
  }

  const _workspaceOwnerRole = roles[RoleType.WORKSPACE]
    .find(role => role.workspaceOwner) as IRoleDocument

  workspaceOwnerRole = _workspaceOwnerRole

  return workspaceOwnerRole
}

export const filterRolePermissionsByAccountLimitations = async (
  roles: IRoleDocument[],
  accountId: string,
): Promise<IRoleDocument[]> => {
  const account = await AccountModel.findAccountById(accountId)

  if (!account) {
    return [...roles]
  }
  const workspacesCount = await WorkspaceModel.countWorkpsacesForAccount(account._id)

  let filteredRoles = [...roles]

  if (workspacesCount >= 1) {
    filteredRoles = filteredRoles.map(role => {
      const roleObj = role.toObject()
      const workspacePermissionIndex = roleObj.permissions
        .findIndex(permission => permission.entity === RoleWorkspacePermissionEntity.WORKSPACE)

      if (workspacePermissionIndex > -1) {
        roleObj.permissions[workspacePermissionIndex].access =
          roleObj.permissions[workspacePermissionIndex].access.filter(action => action !== RoleAccessAction.CREATE)
      }

      return roleObj as unknown as IRoleDocument
    })
  }

  return filteredRoles
}

export const getWorkspaceRole = (
  workspaceRoleId: string,
): IRole | undefined => {
  const role = roles[RoleType.WORKSPACE]
    .find(_role => _role?._id.toString() === workspaceRoleId.toString())

  return role?.toObject()
}
