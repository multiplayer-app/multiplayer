import request from 'supertest'
import { faker } from '@faker-js/faker'
import {
  EntityType,
  EntityCommitStatus,
  EntityCommitChangeType,
  CommitType, EntityVisibility,
} from '@multiplayer/types'
import { slugifyString } from '@multiplayer/util-shared'
import { app } from '../src/app'
import { API_PREFIX, S3_PRIVATE_BUCKET } from '../src/config'
import { Mock, Auth } from './helper'

describe('Commit', () => {
  let user
  let workspaceUser
  let workspace
  let cookie
  let project
  let defaultProjectBranch
  let initialCommit

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

  test('Create new commit with attached entity commit', async () => {
    const entityPayload = {
      type: EntityType.SKETCH,
      key: slugifyString(faker.system.fileName()),
    }

    const { body: entityData } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultProjectBranch._id}/entities`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send(entityPayload)
      .expect(200)

    const { entity, entityCommit, commit } = entityData
    const expectedEntityResponse = {
      ...JSON.parse(JSON.stringify(entityPayload)),
      metadata: {
        visibility: EntityVisibility.PRIVATE,
        shortDescription: '',
      },
      keyAliases: [],
      tags: [],
      hostnames: [],
      entityId: expect.any(String),
      workspace: workspace._id.toString(),
      project: project._id.toString(),
      projectBranch: defaultProjectBranch._id.toString(),
      typeOfChangeInBranch: EntityCommitChangeType.CREATE,
      archived: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }

    expect(entity).toEqual(expectedEntityResponse)

    const expectedEntityCommitResponse = {
      ...JSON.parse(JSON.stringify(entityCommit)),
      _id: expect.any(String),
      __v: 0,
      entity: entity.entityId.toString(),
      bucket: S3_PRIVATE_BUCKET,
      key: `workspaces/${workspace._id.toString()}/projects/${project._id.toString()}/entities/${entity.entityId}/entity-commits/${entityCommit._id}`,
      entityType: entity.type,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      meta: {
        entityName: entity.key,
        links: [],
        summary: expectedEntityResponse.metadata,
      },
    }

    expect(entityCommit).toEqual(expectedEntityCommitResponse)

    const expectedCommitResponse = {
      type: CommitType.AUTO,
      message: expect.any(String),
      _id: expect.any(String),
      __v: 0,
      projectBranch: defaultProjectBranch._id.toString(),
      workspace: workspace._id.toString(),
      project: project._id.toString(),
      parentCommit: initialCommit._id.toString(),
      workspaceUsers: [workspaceUser._id.toString()],
      entityCommits: [{
        _id: entityCommit._id,
        __v: 0,
        workspace: workspace._id.toString(),
        project: project._id.toString(),
        projectBranch: defaultProjectBranch._id.toString(),
        commit: commit._id,
        entity: entity.entityId.toString(),
        bucket: entityCommit.bucket,
        key: entityCommit.key,
        storageType: entityCommit.storageType,
        baseEntityCommit: entityCommit._id,
        changeType: entityCommit.changeType,
        entityType: entity.type,
        status: EntityCommitStatus.DONE,
        createdAt: entityCommit.createdAt,
        updatedAt: expect.any(String),
        meta: entityCommit.meta,
        linkedToCommit: true,
      }],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }

    expect(commit).toEqual(expectedCommitResponse)
  })
})
