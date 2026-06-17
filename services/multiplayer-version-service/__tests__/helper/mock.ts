import { mongoose } from '@multiplayer/mongo'
import {
  ProjectBranchType,
  ProjectBranchStatus,
  CommitType,
  EntityType,
  EntityCommitStorageType,
  EntityCommitStatus,
  RoleType,
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
  WorkspaceUserStatus,
  AccountType,
} from '@multiplayer/types'
import { faker } from '@faker-js/faker'
import {
  UserModel,
  WorkspaceModel,
  ProjectModel,
  ProjectBranchModel,
  CommitModel,
  WorkspaceUserModel,
  EntityModel,
  EntityCommitModel,
  RoleModel,
  CounterModel,
  AccountModel,
} from '@multiplayer/models'
import { slugifyString } from '@multiplayer/util-shared'
import * as fs from 'fs'
import { s3 } from '@multiplayer/s3'
import { S3_PRIVATE_BUCKET } from '../../src/config'
import { ProjectStateTestContext } from './project-state-test-context'

export const accountRoles = [{
  name: 'Account Role',
  type: RoleType.ACCOUNT,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.CREATE,
    ],
  }],
}]

export const workspaceRoles = [{
  name: 'Owner',
  workspaceOwner: true,
  type: RoleType.WORKSPACE,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.BILLING_READ,
      RoleAccessAction.BILLING_UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.PROJECT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.PROJECT_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.AI,
    access: [
      RoleAccessAction.CREATE,
    ],
  }],
}, {
  name: 'Admin',
  workspaceAdmin: true,
  type: RoleType.WORKSPACE,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.PROJECT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.PROJECT_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.AI,
    access: [
      RoleAccessAction.CREATE,
    ],
  }],
}, {
  name: 'Member',
  default: true,
  type: RoleType.WORKSPACE,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.PROJECT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.AI,
    access: [
      RoleAccessAction.CREATE,
    ],
  }],
}]

export const teamRoles = [{
  name: 'Admin',
  teamAdmin: true,
  type: RoleType.PROJECT,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.THREAD,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RELEASE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEPLOYMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }],
}, {
  name: 'Member',
  default: true,
  type: RoleType.PROJECT,
  permissions: [{
    entity: RoleProjectPermissionEntity.COMMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.THREAD,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RELEASE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEPLOYMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }],
}]

export const roles = async () => {
  const allRoles = await RoleModel.find({})

  const rolesToCreate = [
    ...accountRoles.filter(accountRole => {
      return !allRoles.find(existingRole => existingRole.type === accountRole.type && accountRole.name === existingRole.name)
    }),
    ...workspaceRoles.filter(workspaceRole => {
      return !allRoles.find(existingRole => existingRole.type === workspaceRole.type && workspaceRole.name === existingRole.name)
    }),
    ...teamRoles.filter(teamRole => {
      return !allRoles.find(existingRole => existingRole.type === teamRole.type && teamRole.name === existingRole.name)
    }),
  ]


  await RoleModel.insertMany(rolesToCreate)
}

export const user = async () => {
  const email = faker.internet.email().toLowerCase()
  const password = faker.internet.password()

  const user = await UserModel.createByLocalEmail(email, password, { enabled: true })

  return {
    user,
    password,
  }
}

export const workspace = async (userId) => {
  const workspaceName = faker.internet.userName()
  const workspaceId = new mongoose.Types.ObjectId()

  const account = await AccountModel.createAccount({
    type: AccountType.PRIVATE,
    name: faker.person.firstName(),
    workspaces: [workspaceId],
    owner: userId,
  })

  const workspaceUser = await WorkspaceUserModel.createWorkspaceUser({
    user: userId,
    workspace: workspaceId,
    status: WorkspaceUserStatus.ACTIVE,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: faker.internet.displayName(),
    color: faker.internet.color(),
  })

  const workspaceOwnerRole = await RoleModel.findWorkspaceOwnerRole()

  const workspace = await WorkspaceModel.createWorkspace({
    _id: workspaceId,
    account: account._id,
    name: workspaceName,
    handle: faker.internet.displayName(),
    domains: [{
      domain: faker.internet.domainName(),
    }],
    users: [{
      workspaceUser: workspaceUser._id,
      role: workspaceOwnerRole._id,
    }],
  })

  return {
    workspace,
    workspaceUser,
  }
}

export const project = async (workspaceId) => {
  const project = await ProjectModel.createProject({
    workspace: workspaceId,
    name: faker.commerce.productName(),
  })

  const defaultProjectBranch = await ProjectBranchModel.createProjectBranch({
    workspace: workspaceId,
    project: project._id,
    name: `main ${faker.commerce.productName()}`,
    type: ProjectBranchType.FEATURE,
    status: ProjectBranchStatus.IN_PROGRESS,
    default: true,
  })

  const initialCommit = await CommitModel.createCommit({
    workspace: workspaceId,
    project: project._id,
    projectBranch: defaultProjectBranch._id,
    message: 'Initial commit',
    type: CommitType.AUTO,
  })

  return {
    project,
    defaultBranch: defaultProjectBranch,
    initialCommit,
  }
}

export const entity = async (projectId, projectBranchId) => {
  const project = await ProjectModel.findProjectById(projectId)

  const entityId = new mongoose.Types.ObjectId()

  const entity = await EntityModel.createEntity({
    workspace: project?.workspace,
    project: projectId,
    entityId,
    projectBranch: projectBranchId,
    type: EntityType.FILE,
    path: '/',
    keyAliases: [faker.system.fileName()].map(slugifyString),
    archived: false,
  })

  return entity
}

export const entityCommit = async (
  entityId,
  changeType,
  projectBranchId,
  commitId,
  parentEntityCommitId,
) => {
  const entityCommitId = new mongoose.Types.ObjectId()

  const projectBranch = await ProjectBranchModel.findProjectBranchById(projectBranchId)
  const project = await ProjectModel.findProjectById(projectBranch?.project.toString() as string)

  const entityCommit = await EntityCommitModel.createEntityCommit({
    _id: entityCommitId,
    workspace: project?.workspace,
    project: project?._id,
    projectBranch: projectBranchId,
    changeType,
    entity: entityId,
    commit: commitId,
    parentEntityCommit: parentEntityCommitId,
    storageType: EntityCommitStorageType.S3,
    status: EntityCommitStatus.DONE,
    bucket: S3_PRIVATE_BUCKET,
    key: `commits/${entityId}/${entityCommitId}`,
  })

  await s3.uploadFile(
    entityCommit.key as string,
    entityCommit?.bucket as string,
    fs.readFileSync(`${__dirname}/sample_file.txt`),
  )

  return entityCommit
}

export const commit = async (
  projectBranchId,
  parentCommitId,
  entityCommitIds,
  mergeFromBranchId?,
  mergeFromCommitId?,
) => {
  const projectBranch = await ProjectBranchModel.findProjectBranchById(projectBranchId)
  const project = await ProjectModel.findProjectById(projectBranch?.project.toString() as string)

  const commit = await CommitModel.createCommit({
    workspace: project?.workspace,
    project: project?._id,
    projectBranch: projectBranchId,
    type: CommitType.AUTO,
    parentCommit: parentCommitId,
    message: faker.git.commitMessage(),
    entityCommits: entityCommitIds,
    ...mergeFromBranchId ? { mergeFromBranch: mergeFromBranchId } : {},
    ...mergeFromCommitId ? { mergeFromCommit: mergeFromCommitId } : {},
  })

  return commit
}

export const counter = async () => {
  return CounterModel.findOneAndUpdate(
    { _id: 'User-Counter' },
    { $setOnInsert: { seq: 10000 } },
    { upsert: true, new: true },
  )
}

export const createMockUserWithWorkspaceAndProject = async (): Promise<ProjectStateTestContext> => {
  const mockUserResp = await user()
  const mockedWorkspace = await workspace(mockUserResp.user._id)
  const mockedProject = await project(mockedWorkspace.workspace._id)

  return {
    userId: mockUserResp.user._id,
    workspaceUserId: mockedWorkspace.workspaceUser._id,
    workspaceId: mockedWorkspace.workspace._id,
    projectId: mockedProject.project._id,
    defaultProjectBranchId: mockedProject.defaultBranch._id,
    initialCommitId: mockedProject.initialCommit._id,
  }
}
