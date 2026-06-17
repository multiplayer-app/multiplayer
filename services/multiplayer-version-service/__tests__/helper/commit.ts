import {
  CommitType,
  EntityCommitChangeType,
  EntityCommitStorageType,
  EntityCommitStatus,
  IEntityCommit,
} from '@multiplayer/types'
import { Types } from 'mongoose'
import { faker } from '@faker-js/faker'
import * as fs from 'fs'
import { fetch } from '@multiplayer/fetch'
import request from 'supertest'
import { API_PREFIX } from '../../src/config'

interface EntityChange {
  entityId?: string | Types.ObjectId
  entityCommitChangeType?: EntityCommitChangeType

  entityCommitId?: string | Types.ObjectId
}

const wait = ms => new Promise(res => setTimeout(res, ms))

export const uploadMockedEntityCommitFile = (url) => {
  return fetch.put(
    url,
    fs.readFileSync(`${__dirname}/sample_file.txt`),
  )
}

export const createEntityCommits = async (
  app,
  cookie,
  workspaceId,
  projectId,
  projectBranchId,
  entitiesList: EntityChange[],
): Promise<Array<IEntityCommit>> => {
  const entityCommits = await Promise.all(entitiesList.map(
    async ({ entityId, entityCommitChangeType, entityCommitId }, index) => {
      if (entityCommitId) {
        return { _id: entityCommitId }
      }
      //await wait(index * 150)

      const createEntityCommitResponse = await request(app)
        .post(`${API_PREFIX}/workspaces/${workspaceId}/projects/${projectId}/branches/${projectBranchId}/entities/${entityId}/commits`)
        .set('Accept', 'application/json')
        .set('Cookie', [cookie])
        .expect('Content-Type', /application\/json/)
        .send({
          changeType: entityCommitChangeType,
          ...entityCommitChangeType !== EntityCommitChangeType.DELETE
            ? { storageType: EntityCommitStorageType.S3 }
            : {},
        })
        .expect(200)

      let entityCommit = createEntityCommitResponse.body

      if (entityCommitChangeType !== EntityCommitChangeType.DELETE) {
        await uploadMockedEntityCommitFile(entityCommit.url)

        const updateEntityCommitResponse = await request(app)
          .patch(`${API_PREFIX}/workspaces/${workspaceId}/projects/${projectId}/branches/${projectBranchId}/entities/${entityId}/commits/${entityCommit._id}`)
          .set('Accept', 'application/json')
          .set('Cookie', [cookie])
          .expect('Content-Type', /application\/json/)
          .send({
            status: EntityCommitStatus.DONE,
          })
          .expect(200)

        entityCommit = updateEntityCommitResponse.body
      }

      return entityCommit
    }))

  return entityCommits
}

export const createCommit = async (
  app,
  cookie,
  workspaceId,
  projectId,
  projectBranchId,
  entitiesList: EntityChange[],
  workspaceUserId,
  message?,
) => {
  const entityCommits = await createEntityCommits(
    app,
    cookie,
    workspaceId,
    projectId,
    projectBranchId,
    entitiesList,
  )

  const { body: commit } = await request(app)
    .post(`/internal${API_PREFIX}/workspaces/${workspaceId}/projects/${projectId}/branches/${projectBranchId}/commits`)
    .set('Accept', 'application/json')
    .set('Cookie', [cookie])
    .expect('Content-Type', /application\/json/)
    .send({
      type: CommitType.MANUAL,
      message: message || faker.git.commitMessage(),
      entityCommits: entityCommits.map(({ _id }) => _id.toString()),
      workspaceUsers: [workspaceUserId],
    })
    .expect(200)

  return commit
}
