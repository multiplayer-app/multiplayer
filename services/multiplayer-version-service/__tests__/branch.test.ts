import request from 'supertest'
import { faker } from '@faker-js/faker'
import {
  ProjectBranchStatus,
  ProjectBranchType,
  EntityType,
} from '@multiplayer/types'
import { slugifyString } from '@multiplayer/util-shared'
import { app } from '../src/app'
import { API_PREFIX } from '../src/config'
import { Mock, Auth } from './helper'

describe('Branch', () => {
  let user
  let workspace
  let workspaceUser
  let cookie
  let project
  let defaultProjectBranch
  let initialCommit
  let entityA

  beforeAll(async () => {
    const { user: _user } = await Mock.user()

    user = _user

    const mockedWorkspace = await Mock.workspace(user._id)
    workspaceUser = mockedWorkspace.workspaceUser
    workspace = mockedWorkspace.workspace
    const mockedProject = await Mock.project(workspace._id)

    project = mockedProject.project
    defaultProjectBranch = mockedProject.defaultBranch
    initialCommit = mockedProject.initialCommit

    cookie = await Auth.generateSession(user._id)
  })

  test('Create new branch', async () => {
    const payload = {
      name: faker.git.branch(),
      status: ProjectBranchStatus.IN_PROGRESS,
      type: ProjectBranchType.FEATURE,
      parentProjectBranch: defaultProjectBranch._id,
    }

    const { body: newBranch } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send(payload)
      .expect(200)

    const expectedBranchResponse = {
      _id: expect.any(String),
      name: payload.name,
      defaultGitBranchName: payload.name,
      status: ProjectBranchStatus.IN_PROGRESS,
      type: ProjectBranchType.FEATURE,
      reviews: [],
      workspace: workspace._id.toString(),
      project: project._id.toString(),
      parentProjectBranch: defaultProjectBranch._id.toString(),
      parentCommit: initialCommit._id.toString(),
      default: false,
      archived: false,
      __v: 0,
      lastCommitMeta: {
        workspaceUsers: [],
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }

    expect(newBranch).toEqual(expectedBranchResponse)
  })

  test('Branch should have last commit meta', async () => {
    const payload = {
      name: faker.git.branch(),
      status: ProjectBranchStatus.IN_PROGRESS,
      type: ProjectBranchType.FEATURE,
      parentProjectBranch: defaultProjectBranch._id.toString(),
    }

    const { body: newBranch } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send(payload)
      .expect(200)

    const expectedBranchResponse = {
      _id: expect.any(String),
      name: payload.name,
      defaultGitBranchName: payload.name,
      status: ProjectBranchStatus.IN_PROGRESS,
      type: ProjectBranchType.FEATURE,
      reviews: [],
      workspace: workspace._id.toString(),
      project: project._id.toString(),
      parentProjectBranch: defaultProjectBranch._id.toString(),
      parentCommit: initialCommit._id.toString(),
      default: false,
      archived: false,
      __v: 0,
      lastCommitMeta: {
        workspaceUsers: [],
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }

    expect(newBranch).toEqual(expectedBranchResponse)
    const entityAResponse = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${newBranch._id}/entities`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        type: EntityType.FILE,
        path: '/',
        key: slugifyString(faker.system.fileName()),
        archived: false,
      })
      .expect(200)
    entityA = entityAResponse.body.entity
    const commitA1 = entityAResponse.body.commit

    const { body: updatedNewBranch } = await request(app)
      .get(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${newBranch._id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .expect(200)

    const expectedUpdatedBranchResponse = {
      _id: expect.any(String),
      name: payload.name,
      defaultGitBranchName: payload.name,
      status: ProjectBranchStatus.IN_PROGRESS,
      type: ProjectBranchType.FEATURE,
      reviews: [],
      workspace: workspace._id.toString(),
      project: project._id.toString(),
      parentProjectBranch: defaultProjectBranch._id.toString(),
      parentCommit: initialCommit._id.toString(),
      default: false,
      archived: false,
      lastCommitMeta: {
        workspaceUsers: [workspaceUser._id.toString()],
        date: commitA1.createdAt,
      },
      __v: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }

    expect(updatedNewBranch).toEqual(expectedUpdatedBranchResponse)
  })
})
