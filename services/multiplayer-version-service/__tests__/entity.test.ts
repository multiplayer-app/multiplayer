import request from 'supertest'
import { faker } from '@faker-js/faker'
import {
  EntityCommitChangeType,
  EntityCommitStatus,
  EntityCommitStorageType,
  EntityType,
  EntityVisibility,
} from '@multiplayer/types'
import { slugifyString } from '@multiplayer/util-shared'
import { app } from '../src/app'
import { API_PREFIX } from '../src/config'
import { Auth, Mock } from './helper'
import { uploadMockedEntityCommitFile } from './helper/commit'

describe('Entity', () => {
  let user
  let workspace
  let workspaceUser
  let cookie
  let project
  let defaultBranch
  let initialCommit

  beforeAll(async () => {
    const { user: _user } = await Mock.user()

    user = _user

    const mockedWorkspace = await Mock.workspace(user._id)
    workspaceUser = mockedWorkspace.workspaceUser
    workspace = mockedWorkspace.workspace
    const mockedProject = await Mock.project(workspace._id)

    project = mockedProject.project
    defaultBranch = mockedProject.defaultBranch
    initialCommit = mockedProject.initialCommit

    cookie = await Auth.generateSession(user._id)
  })

  test('Create new entity', async () => {
    const entityPayload = {
      type: EntityType.SKETCH,
      key: slugifyString(faker.system.fileName()),
    }

    const { body: entityData } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultBranch._id}/entities`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /application\/json/)
      .set('Cookie', [cookie])
      .send(entityPayload)
      .expect(200)

    const { entity } = entityData
    const expectedEntityResponse = {
      ...JSON.parse(JSON.stringify(entityPayload)),
      metadata: {
        visibility: EntityVisibility.PRIVATE,
        shortDescription: '',
      },
      keyAliases: [],
      hostnames: [],
      tags: [],
      workspace: workspace._id.toString(),
      project: project._id.toString(),
      entityId: expect.any(String),
      projectBranch: defaultBranch._id.toString(),
      typeOfChangeInBranch: EntityCommitChangeType.CREATE,
      archived: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }

    expect(entity).toEqual(expectedEntityResponse)
  })

  test('EntityCommit update should fail without file upload', async () => {
    const { body: entityResp } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultBranch._id}/entities`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /application\/json/)
      .set('Cookie', [cookie])
      .send({
        type: EntityType.SKETCH,
        key: slugifyString(faker.system.fileName()),
      })
      .expect(200)
    const entity = entityResp.entity

    const { body: entityCommit } = await request(app)
      .post(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultBranch._id}/entities/${entity.entityId}/commits`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        changeType: EntityCommitChangeType.UPDATE,
        storageType: EntityCommitStorageType.S3,
      })
      .expect(200)

    await request(app)
      .patch(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultBranch._id}/entities/${entity.entityId}/commits/${entityCommit._id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send({
        status: EntityCommitStatus.DONE,
      })
      .expect(424)
  })
  test('EntityCommit update', async () => {
    const { body: entityResp } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultBranch._id}/entities`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /application\/json/)
      .set('Cookie', [cookie])
      .send({
        type: EntityType.SKETCH,
        key: slugifyString(faker.system.fileName()),
      })
      .expect(200)
    const entity = entityResp.entity

    const { body: entityCommit } = await request(app)
      .post(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultBranch._id}/entities/${entity.entityId}/commits`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        changeType: EntityCommitChangeType.UPDATE,
        storageType: EntityCommitStorageType.S3,
      })
      .expect(200)
    await uploadMockedEntityCommitFile(entityCommit.url)
    await request(app)
      .patch(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultBranch._id}/entities/${entity.entityId}/commits/${entityCommit._id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send({
        status: EntityCommitStatus.DONE,
      })
      .expect('Content-Type', /application\/json/)
      .expect(200)
  })
})
