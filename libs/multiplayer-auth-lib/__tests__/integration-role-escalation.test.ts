jest.mock('@multiplayer/redis', () => ({
  default: { get: jest.fn(), set: jest.fn(), del: jest.fn(), connect: jest.fn() },
  connect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}))

jest.mock('@multiplayer/models', () => ({
  IntegrationModel: { findIntegrationByIdInWorkspace: jest.fn() },
  RoleModel: {},
  AccountModel: {},
  WorkspaceModel: {},
}))

jest.mock('@multiplayer/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}))

import { Integration } from '../src/access-control/entities/integration'
import { roles } from '../src/access-control/role'
import {
  RoleType,
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'

const WORKSPACE_ID = 'a'.repeat(24)

const makeId = (char: string) => char.repeat(24)

const makeRole = (id: string, permissions: { entity: string; access: RoleAccessAction[] }[]) => ({
  _id: { toString: () => id, equals: (other: any) => other?.toString() === id },
  permissions,
  toObject: function () { return this },
})

const makeReq = (overrides: {
  workspaceRoleId?: string
  workspaceOwner?: boolean
  workspaceAdmin?: boolean
  superAdmin?: boolean
  projectRoleIds?: string[]
  body?: Record<string, string>
}) => ({
  session: { current: 'user-id' },
  params: { workspaceId: WORKSPACE_ID },
  query: {},
  body: overrides.body ?? {},
  bulk: false,
  overrideIdPath: undefined,
  context: {
    workspaceId: WORKSPACE_ID,
    workspaceRoleId: overrides.workspaceRoleId,
    workspaceOwner: overrides.workspaceOwner ?? false,
    workspaceAdmin: overrides.workspaceAdmin ?? false,
    superAdmin: overrides.superAdmin ?? false,
    projects: overrides.projectRoleIds
      ? [{ projectId: makeId('e'), projectRoleIds: overrides.projectRoleIds }]
      : [],
    teams: [],
    objects: [],
  },
})

beforeEach(() => {
  roles[RoleType.WORKSPACE] = []
  roles[RoleType.PROJECT] = []
  roles[RoleType.ACCOUNT] = []
  roles[RoleType.PUBLIC_SHARE] = []
})

describe('Integration ability() — workspace role escalation', () => {
  const callerRoleId = makeId('b')
  const targetRoleId = makeId('c')

  const callerPermissions = [
    { entity: RoleWorkspacePermissionEntity.INTEGRATION, access: [RoleAccessAction.CREATE, RoleAccessAction.READ] },
    { entity: RoleWorkspacePermissionEntity.PROJECT, access: [RoleAccessAction.READ] },
  ]

  beforeEach(() => {
    roles[RoleType.WORKSPACE].push(makeRole(callerRoleId, callerPermissions) as any)
  })

  it('allows assigning a role with equal permissions', async () => {
    roles[RoleType.WORKSPACE].push(makeRole(targetRoleId, callerPermissions) as any)

    const req = makeReq({
      workspaceRoleId: callerRoleId,
      body: { workspaceRole: targetRoleId },
    })

    await expect(new Integration(req as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('allows assigning a role with a subset of caller permissions', async () => {
    roles[RoleType.WORKSPACE].push(makeRole(targetRoleId, [
      { entity: RoleWorkspacePermissionEntity.INTEGRATION, access: [RoleAccessAction.READ] },
    ]) as any)

    const req = makeReq({
      workspaceRoleId: callerRoleId,
      body: { workspaceRole: targetRoleId },
    })

    await expect(new Integration(req as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('blocks assigning a role with more permissions than the caller has', async () => {
    roles[RoleType.WORKSPACE].push(makeRole(targetRoleId, [
      {
        entity: RoleWorkspacePermissionEntity.INTEGRATION,
        access: [RoleAccessAction.CREATE, RoleAccessAction.READ, RoleAccessAction.DELETE],
      },
    ]) as any)

    const req = makeReq({
      workspaceRoleId: callerRoleId,
      body: { workspaceRole: targetRoleId },
    })

    await expect(new Integration(req as any).ability(RoleAccessAction.CREATE)).rejects.toThrow()
  })

  it('blocks assigning a role that grants an entity the caller has no access to', async () => {
    roles[RoleType.WORKSPACE].push(makeRole(targetRoleId, [
      { entity: RoleWorkspacePermissionEntity.INTEGRATION, access: [RoleAccessAction.READ] },
      { entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER, access: [RoleAccessAction.DELETE] },
    ]) as any)

    const req = makeReq({
      workspaceRoleId: callerRoleId,
      body: { workspaceRole: targetRoleId },
    })

    await expect(new Integration(req as any).ability(RoleAccessAction.CREATE)).rejects.toThrow()
  })

  it('allows workspaceAdmin to assign any workspace role', async () => {
    roles[RoleType.WORKSPACE].push(makeRole(targetRoleId, [
      {
        entity: RoleWorkspacePermissionEntity.INTEGRATION,
        access: [RoleAccessAction.CREATE, RoleAccessAction.READ, RoleAccessAction.DELETE, RoleAccessAction.UPDATE],
      },
      { entity: RoleWorkspacePermissionEntity.WORKSPACE, access: [RoleAccessAction.DELETE] },
    ]) as any)

    const req = makeReq({
      workspaceAdmin: true,
      body: { workspaceRole: targetRoleId },
    })

    await expect(new Integration(req as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('allows workspaceOwner to assign any workspace role', async () => {
    roles[RoleType.WORKSPACE].push(makeRole(targetRoleId, [
      {
        entity: RoleWorkspacePermissionEntity.INTEGRATION,
        access: Object.values(RoleAccessAction),
      },
    ]) as any)

    const req = makeReq({
      workspaceOwner: true,
      body: { workspaceRole: targetRoleId },
    })

    await expect(new Integration(req as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('allows superAdmin to assign any workspace role', async () => {
    roles[RoleType.WORKSPACE].push(makeRole(targetRoleId, [
      {
        entity: RoleWorkspacePermissionEntity.INTEGRATION,
        access: Object.values(RoleAccessAction),
      },
    ]) as any)

    const req = makeReq({
      superAdmin: true,
      body: { workspaceRole: targetRoleId },
    })

    await expect(new Integration(req as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('blocks when target workspace role does not exist in memory', async () => {
    const req = makeReq({
      workspaceRoleId: callerRoleId,
      body: { workspaceRole: makeId('f') },
    })

    await expect(new Integration(req as any).ability(RoleAccessAction.CREATE)).rejects.toThrow()
  })
})

describe('Integration ability() — project role escalation', () => {
  const callerProjectRoleId = makeId('d')
  const targetProjectRoleId = makeId('e')

  const callerProjectPermissions = [
    { entity: RoleProjectPermissionEntity.ENTITY, access: [RoleAccessAction.CREATE, RoleAccessAction.READ] },
    { entity: RoleProjectPermissionEntity.COMMENT, access: [RoleAccessAction.READ] },
  ]

  beforeEach(() => {
    // Caller needs INTEGRATION:CREATE at workspace level to pass the base ability() check
    const workspaceRoleId = makeId('w')
    roles[RoleType.WORKSPACE].push(makeRole(workspaceRoleId, [
      { entity: RoleWorkspacePermissionEntity.INTEGRATION, access: [RoleAccessAction.CREATE, RoleAccessAction.READ] },
    ]) as any)

    roles[RoleType.PROJECT].push(makeRole(callerProjectRoleId, callerProjectPermissions) as any)
  })

  const makeProjectReq = (targetRoleId: string, overrides: { workspaceAdmin?: boolean; workspaceOwner?: boolean; superAdmin?: boolean } = {}) =>
    makeReq({
      workspaceRoleId: makeId('w'),
      projectRoleIds: [callerProjectRoleId],
      body: { projectRole: targetRoleId },
      ...overrides,
    })

  it('allows assigning a project role with equal permissions', async () => {
    roles[RoleType.PROJECT].push(makeRole(targetProjectRoleId, callerProjectPermissions) as any)

    await expect(new Integration(makeProjectReq(targetProjectRoleId) as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('allows assigning a project role with a subset of caller permissions', async () => {
    roles[RoleType.PROJECT].push(makeRole(targetProjectRoleId, [
      { entity: RoleProjectPermissionEntity.COMMENT, access: [RoleAccessAction.READ] },
    ]) as any)

    await expect(new Integration(makeProjectReq(targetProjectRoleId) as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('blocks assigning a project role with more permissions than the caller has', async () => {
    roles[RoleType.PROJECT].push(makeRole(targetProjectRoleId, [
      {
        entity: RoleProjectPermissionEntity.ENTITY,
        access: [RoleAccessAction.CREATE, RoleAccessAction.READ, RoleAccessAction.DELETE],
      },
    ]) as any)

    await expect(new Integration(makeProjectReq(targetProjectRoleId) as any).ability(RoleAccessAction.CREATE)).rejects.toThrow()
  })

  it('blocks assigning a project role with an entity the caller has no access to', async () => {
    roles[RoleType.PROJECT].push(makeRole(targetProjectRoleId, [
      { entity: RoleProjectPermissionEntity.ENVIRONMENT, access: [RoleAccessAction.CREATE] },
    ]) as any)

    await expect(new Integration(makeProjectReq(targetProjectRoleId) as any).ability(RoleAccessAction.CREATE)).rejects.toThrow()
  })

  it('allows workspaceAdmin to assign any project role', async () => {
    roles[RoleType.PROJECT].push(makeRole(targetProjectRoleId, [
      { entity: RoleProjectPermissionEntity.ENTITY, access: Object.values(RoleAccessAction) },
    ]) as any)

    await expect(new Integration(makeProjectReq(targetProjectRoleId, { workspaceAdmin: true }) as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('allows workspaceOwner to assign any project role', async () => {
    roles[RoleType.PROJECT].push(makeRole(targetProjectRoleId, [
      { entity: RoleProjectPermissionEntity.ENTITY, access: Object.values(RoleAccessAction) },
    ]) as any)

    await expect(new Integration(makeProjectReq(targetProjectRoleId, { workspaceOwner: true }) as any).ability(RoleAccessAction.CREATE)).resolves.toBe(true)
  })

  it('blocks when target project role does not exist in memory', async () => {
    await expect(new Integration(makeProjectReq(makeId('9')) as any).ability(RoleAccessAction.CREATE)).rejects.toThrow()
  })
})
