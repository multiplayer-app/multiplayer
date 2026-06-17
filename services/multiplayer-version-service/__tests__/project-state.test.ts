import request from 'supertest'
import { faker } from '@faker-js/faker'
import {
  EntityCommitChangeType,
  ProjectBranchStatus,
  ProjectBranchType,
  EntityType,
} from '@multiplayer/types'
import { slugifyString } from '@multiplayer/util-shared'
import { app } from '../src/app'
import { API_PREFIX } from '../src/config'
import { Mock, Auth, Commit } from './helper'

describe('Project state', () => {
  let user
  let workspace
  let workspaceUser
  let cookie
  let project
  let defaultProjectBranch
  let featureBranchA
  let featureBranchB
  let featureBranchC
  let initialCommit
  let entityA
  let entityB
  let entityC
  let entityD
  let entityE
  let entityF

  let entityCommit1
  let entityCommit2
  let entityCommit3
  let entityCommit4
  let entityCommit5
  let entityCommit6
  let entityCommit7
  let entityCommit8
  let entityCommit9
  let entityCommit10
  let entityCommit11
  let entityCommit12
  let entityCommit13
  let entityCommit14
  let entityCommit15
  let entityCommit16
  let entityCommit17
  let entityCommit18
  let entityCommit19
  // let entityCommit20
  let entityCommit21
  let entityCommit22
  let entityCommit24
  let entityCommit25

  let commitM1
  let commitM2
  let commitM3
  let commitM4
  let commitM5
  let commitM6
  let commitM7
  let commitM8
  let commitA1
  let commitA2
  let commitA3
  let commitA4
  let commitB1
  let commitB2
  let commitB3
  let commitB4
  let commitC1
  let commitC2
  let commitC3
  let commitC4

  beforeAll(async () => {

    //
    //                  /---A1------A2--------A3---------A4--------------\  feature A
    //                / eF(ec2:C)  eC(ec5:C) eF(ec6:U) eF(ec7:D)          \
    //              /                                                      \
    //---init-----M1---------------M2----------------M3--------------------M4-------------M5---------------M6----------------M7-------------------------------M8----------> main
    //         eA(ec1:C)    eB(ec3:C),            eA(ec9:U)              merge          merge          eA(ec18:U)        eB(ec21:U),\                        /merge
    //                      eE(ec4:C)\                     \         eC(ec13:C)\       / eA(ec15:U),          \           eC(ec22:D) \                     /  eD(ec24:C),
    //                                \                     \                   \    /   eE(ec16:U)            \                      \                  /    eE(ec25:D)
    //                                 \                     \                   \ /                            \                      \               /
    //                                  \--B1------------B2----------B3----------B4      feature B               \                      \            /
    //                                 eA(ec8:U)     eA(ec10:U)\   eE(ec11:U)    merge                            \                      \         /
    //                                                          \                eA(ec14:U)                        \                      \      /
    //                                                           \               eE(ec19:U)                         \                      \   /
    //                                                            \------C1-------------------C2--------------------C3---------------------C4/  feature C
    //                                                                eD(ec12:C)            eE(ec17:D)             merge                  merge
    //
    //
    //

    const { user: _user } = await Mock.user()
    user = _user
    cookie = await Auth.generateSession(user._id)

    const mockedWorkspace = await Mock.workspace(user._id)
    workspaceUser = mockedWorkspace.workspaceUser
    workspace = mockedWorkspace.workspace
    const mockedProject = await Mock.project(workspace._id)

    project = mockedProject.project
    defaultProjectBranch = mockedProject.defaultBranch
    initialCommit = mockedProject.initialCommit

    const entityAResponse = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultProjectBranch._id}/entities`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        type: EntityType.NOTEBOOK,
        path: '/',
        key: slugifyString('entity A.txt'),
        archived: false,
      })
      .expect(200)
    entityA = entityAResponse.body.entity

    // commit 1 on main
    commitM1 = entityAResponse.body.commit
    entityCommit1 = entityAResponse.body.entityCommit

    // create feature A branch
    const { body: newBranchA } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        name: `branch A ${faker.git.branch()}`,
        status: ProjectBranchStatus.IN_PROGRESS,
        type: ProjectBranchType.FEATURE,
        parentProjectBranch: defaultProjectBranch._id,
      })
      .expect(200)

    featureBranchA = newBranchA

    const entityFResponse = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${featureBranchA._id}/entities`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        type: EntityType.SKETCH,
        path: '/',
        key: slugifyString('entity F.txt'),
        archived: false,
      })
      .expect(200)
    entityF = entityFResponse.body.entity
    commitA1 = entityFResponse.body.commit
    entityCommit2 = entityFResponse.body.entityCommit

    const bulkResponse = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultProjectBranch._id}/entities/bulk`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send([{
        type: EntityType.PLATFORM,
        key: slugifyString('entity B.txt'),
      }, {
        type: EntityType.FILE,
        key: slugifyString('entity E.txt'),
      }])
      .expect(200)

    entityB = bulkResponse.body.added[0].entity
    entityCommit3 = bulkResponse.body.added[0].entityCommit

    entityE = bulkResponse.body.added[1].entity
    entityCommit4 = bulkResponse.body.added[1].entityCommit

    commitM2 = bulkResponse.body.commit

    const entityCResponse = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${featureBranchA._id}/entities`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        type: EntityType.PLATFORM_COMPONENT,
        path: '/',
        key: slugifyString('entity C.txt'),
        archived: false,
      })
      .expect(200)
    entityC = entityCResponse.body.entity
    commitA2 = entityCResponse.body.commit
    entityCommit5 = entityCResponse.body.entityCommit

    // commit 3 on feature A
    commitA3 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      featureBranchA._id,
      [{
        entityId: entityF.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      }],
      workspaceUser._id,
      'commit A3',
    )
    entityCommit6 = commitA3.entityCommits[0]

    // commit 4 on feature A
    commitA4 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      featureBranchA._id,
      [{
        entityId: entityF.entityId,
        entityCommitChangeType: EntityCommitChangeType.DELETE,
      }],
      workspaceUser._id,
      'commit A4',
    )
    entityCommit7 = commitA4.entityCommits[0]

    // create feature B branch
    const { body: newBranchB } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        name: `branch B ${faker.git.branch()}`,
        status: ProjectBranchStatus.IN_PROGRESS,
        type: ProjectBranchType.FEATURE,
        parentProjectBranch: defaultProjectBranch._id,
      })
      .expect(200)
    featureBranchB = newBranchB

    // commit 1 on feature B
    commitB1 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      featureBranchB._id,
      [{
        entityId: entityA.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      }],
      workspaceUser._id,
      'commit B1',
    )
    entityCommit8 = commitB1.entityCommits[0]

    // commit 3 on main
    commitM3 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      defaultProjectBranch._id,
      [{
        entityId: entityA.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      }],
      workspaceUser._id,
      'commit M3',
    )
    entityCommit9 = commitM3.entityCommits[0]

    // commit 2 on feature B
    commitB2 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      featureBranchB._id,
      [{
        entityId: entityA.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      }],
      workspaceUser._id,
      'commit B2',
    )
    entityCommit10 = commitB2.entityCommits[0]

    // commit 3 on feature B
    commitB3 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      featureBranchB._id,
      [{
        entityId: entityE.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      }],
      workspaceUser._id,
      'commit B3',
    )
    entityCommit11 = commitB3.entityCommits[0]

    // create feature C branch
    const { body: newBranchC } = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        name: `branch C ${faker.git.branch()}`,
        status: ProjectBranchStatus.IN_PROGRESS,
        type: ProjectBranchType.FEATURE,
        parentProjectBranch: defaultProjectBranch._id,
      })
      .expect(200)
    featureBranchC = newBranchC

    const entityDResponse = await request(app)
      .post(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${featureBranchC._id}/entities`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .send({
        type: EntityType.SKETCH,
        path: '/',
        key: slugifyString('entity D.txt'),
        archived: false,
      })
      .expect(200)
    entityD = entityDResponse.body.entity

    // commit 1 on feature C
    commitC1 = entityDResponse.body.commit
    entityCommit12 = entityDResponse.body.entityCommit

    // merge feature A into main (commit 4 on main)
    const merge1Response = await request(app)
      .post(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/merge`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send({
        projectBranchFrom: featureBranchA._id,
        projectBranchTo: defaultProjectBranch._id,
        workspaceUsers: [workspaceUser._id],
      })
      .expect('Content-Type', /application\/json/)
      .expect(200)
    commitM4 = merge1Response.body

    entityCommit13 = commitM4.entityCommits[0]

    const entityCommitsResolveConflicts1 = await Commit.createEntityCommits(
      app,
      cookie,
      workspace._id,
      project._id,
      featureBranchB._id,
      [{
        entityId: entityA.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      },
      {
        entityId: entityE.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      }],
    )

    // merge main into feature B (commit 4 on feature B)
    const merge2Response = await request(app)
      .post(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/merge`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send({
        projectBranchFrom: defaultProjectBranch._id,
        projectBranchTo: featureBranchB._id,
        entityCommits: [
          entityCommitsResolveConflicts1[0]._id,
          entityCommitsResolveConflicts1[1]._id,
        ],
        workspaceUsers: [workspaceUser._id],
      })
      .expect('Content-Type', /application\/json/)
      .expect(200)
    commitB4 = merge2Response.body

    entityCommit14 = commitB4.entityCommits.find(({ entity }) => entity === entityA.entityId)
    entityCommit19 = commitB4.entityCommits.find(({ entity }) => entity === entityE.entityId)

    // merge feature B into main (commit 5 on main)
    const merge3Response = await request(app)
      .post(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/merge`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send({
        projectBranchFrom: featureBranchB._id,
        projectBranchTo: defaultProjectBranch._id,
        workspaceUsers: [workspaceUser._id],
      })
      .expect('Content-Type', /application\/json/)
      .expect(200)
    commitM5 = merge3Response.body

    entityCommit15 = commitM5.entityCommits.find(({ entity }) => entity === entityA.entityId)
    entityCommit16 = commitM5.entityCommits.find(({ entity }) => entity === entityE.entityId)

    // commit 2 on feature C
    commitC2 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      featureBranchC._id,
      [{
        entityId: entityE.entityId,
        entityCommitChangeType: EntityCommitChangeType.DELETE,
      }],
      workspaceUser._id,
      'commit C2',
    )

    entityCommit17 = commitC2.entityCommits[0]

    // commit 6 on main
    commitM6 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      defaultProjectBranch._id,
      [{
        entityId: entityA.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      }],
      workspaceUser._id,
      'commit M6',
    )
    entityCommit18 = commitM6.entityCommits[0]

    // merge main into feature C (commit 3 on feature C)
    const merge4Response = await request(app)
      .post(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/merge`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send({
        projectBranchFrom: defaultProjectBranch._id,
        projectBranchTo: featureBranchC._id,
        workspaceUsers: [workspaceUser._id],
      })
      .expect('Content-Type', /application\/json/)
      .expect(200)
    commitC3 = merge4Response.body

    // commit 7 on main
    commitM7 = await Commit.createCommit(
      app,
      cookie,
      workspace._id,
      project._id,
      defaultProjectBranch._id,
      [{
        entityId: entityC.entityId,
        entityCommitChangeType: EntityCommitChangeType.DELETE,
      }, {
        entityId: entityB.entityId,
        entityCommitChangeType: EntityCommitChangeType.UPDATE,
      }],
      workspaceUser._id,
      'commit M7',
    )
    entityCommit21 = commitM7.entityCommits.find(({ entity }) => entity === entityB.entityId)
    entityCommit22 = commitM7.entityCommits.find(({ entity }) => entity === entityC.entityId)

    // merge main into feature C (commit 4 on feature C)
    const merge5Response = await request(app)
      .post(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/merge`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send({
        projectBranchFrom: defaultProjectBranch._id,
        projectBranchTo: featureBranchC._id,
        workspaceUsers: [workspaceUser._id],
      })
      .expect('Content-Type', /application\/json/)
      .expect(200)
    commitC4 = merge5Response.body

    // merge feature C into main (commit 8 on main)
    const merge6Response = await request(app)
      .post(`/internal${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/merge`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .send({
        workspaceUsers: [workspaceUser._id],
        projectBranchFrom: featureBranchC._id,
        projectBranchTo: defaultProjectBranch._id,
      })
      .expect('Content-Type', /application\/json/)
      .expect(200)
    commitM8 = merge6Response.body

    entityCommit24 = commitM8.entityCommits.find(({ entity }) => entity === entityD.entityId)
    entityCommit25 = commitM8.entityCommits.find(({ entity }) => entity === entityE.entityId)

    // console.dir({
    //   t: '==MOCKED_DATA==',
    //   defaultBranch: defaultProjectBranch._id.toString(),
    //   featureBranchA: featureBranchA._id.toString(),
    //   featureBranchB: featureBranchB._id.toString(),
    //   featureBranchC: featureBranchC._id.toString(),
    //   entityA: entityA.entityId.toString(),
    //   entityB: entityB.entityId.toString(),
    //   entityC: entityC.entityId.toString(),
    //   entityD: entityD.entityId.toString(),
    //   entityE: entityE.entityId.toString(),
    //   entityF: entityF.entityId.toString(),
    //   entityCommit1: entityCommit1._id.toString(),
    //   entityCommit2: entityCommit2._id.toString(),
    //   entityCommit3: entityCommit3._id.toString(),
    //   entityCommit4: entityCommit4._id.toString(),
    //   entityCommit5: entityCommit5._id.toString(),
    //   entityCommit6: entityCommit6._id.toString(),
    //   entityCommit7: entityCommit7._id.toString(),
    //   entityCommit8: entityCommit8._id.toString(),
    //   entityCommit9: entityCommit9._id.toString(),
    //   entityCommit10: entityCommit10._id.toString(),
    //   entityCommit11: entityCommit11._id.toString(),
    //   entityCommit12: entityCommit12._id.toString(),
    //   entityCommit13: entityCommit13._id.toString(),
    //   entityCommit14: entityCommit14._id.toString(),
    //   entityCommit15: entityCommit15._id.toString(),
    //   entityCommit16: entityCommit16._id.toString(),
    //   entityCommit17: entityCommit17._id.toString(),
    //   entityCommit18: entityCommit18._id.toString(),
    //   entityCommit21: entityCommit21._id.toString(),
    //   entityCommit22: entityCommit22._id.toString(),
    //   entityCommit24: entityCommit24._id.toString(),
    //   entityCommit25: entityCommit25._id.toString(),
    //   commitM1: commitM1._id.toString(),
    //   commitM2: commitM2._id.toString(),
    //   commitM3: commitM3._id.toString(),
    //   commitM4: commitM4._id.toString(),
    //   commitM5: commitM5._id.toString(),
    //   commitM6: commitM6._id.toString(),
    //   commitM7: commitM7._id.toString(),
    //   commitM8: commitM8._id.toString(),
    //   commitA1: commitA1._id.toString(),
    //   commitA2: commitA2._id.toString(),
    //   commitA3: commitA3._id.toString(),
    //   commitA4: commitA4._id.toString(),
    //   commitB1: commitB1._id.toString(),
    //   commitB2: commitB2._id.toString(),
    //   commitB3: commitB3._id.toString(),
    //   commitB4: commitB4._id.toString(),
    //   commitC1: commitC1._id.toString(),
    //   commitC2: commitC2._id.toString(),
    //   commitC3: commitC3._id.toString(),
    //   commitC4: commitC4._id.toString(),
    // }, { depth: 20, colors: true })
  })

  test.only('Get project latest state on main', async () => {
    const { body: branchState } = await request(app)
      .get(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${defaultProjectBranch._id}/state`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .expect(200)

    const { typeOfChangeInBranch, ...entityDWithoutChangeType } = entityD

    const expectedBranchState = {
      cursor: {
        skip: 0,
        limit: 30,
        total: 3,
      },
      data: [{
        entity: {
          ...entityDWithoutChangeType,
          __v: 0,
          _id: expect.any(String),
          projectBranch: defaultProjectBranch._id.toString(),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          createdAtCommit: commitM8._id,
          typeOfChangeInBranch: 'CREATE',
          latestEntityCommit: entityCommit24._id,
        },
        entityCommit: {
          ...entityCommit24,
          commit: commitM8._id,
          updatedAt: expect.any(String),
        },
      }, {
        entity: {
          ...entityB,
          __v: 0,
          _id: expect.any(String),
          updatedAt: expect.any(String),
          createdAtCommit: commitM2._id,
          latestEntityCommit: entityCommit21._id,
        },
        entityCommit: {
          ...entityCommit21,
        },
      }, {
        entity: {
          ...entityA,
          __v: 0,
          _id: expect.any(String),
          updatedAt: expect.any(String),
          createdAtCommit: commitM1._id,
          latestEntityCommit: entityCommit18._id,
        },
        entityCommit: {
          ...entityCommit18,
        },
      }],
    }

    expect(branchState).toEqual(expectedBranchState)
  })

  test.only('Get project state on feature A commit 4', async () => {
    const { body: branchState } = await request(app)
      .get(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${featureBranchA._id}/state?commit=${commitA4._id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .expect(200)

    const expectedBranchState = {
      cursor: {
        skip: 0,
        limit: 30,
        total: 3,
      },
      data: [{
        entity: {
          ...entityA,
          _id: expect.any(String),
          __v: 0,
          createdAtCommit: commitM1._id,
          updatedAt: expect.any(String),
          latestEntityCommit: entityCommit18._id,
        },
        entityCommit: {
          ...entityCommit9,
          baseEntityCommit: entityCommit9._id,
          updatedAt: expect.any(String),
          linkedToCommit: true,
        },
      }, {
        entity: {
          ...entityC,
          _id: expect.any(String),
          __v: 0,
          createdAtCommit: commitA2._id,
          updatedAt: expect.any(String),
          latestEntityCommit: entityCommit5._id,
        },
        entityCommit: {
          ...entityCommit5,
          updatedAt: expect.any(String),
          commit: commitA2._id,
          linkedToCommit: true,
        },
      }, {
        entity: {
          ...entityB,
          _id: expect.any(String),
          __v: 0,
          updatedAt: expect.any(String),
          createdAtCommit: commitM2._id,
          latestEntityCommit: entityCommit21._id,
        },
        entityCommit: {
          ...entityCommit3,
          updatedAt: expect.any(String),
          commit: commitM2._id,
          linkedToCommit: true,
        },
      }],
    }

    expect(branchState).toEqual(expectedBranchState)
  })

  test.only('Get project state on feature B commit 4', async () => {
    const { body: branchState } = await request(app)
      .get(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${featureBranchB._id}/state?commit=${commitB4._id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .expect(200)

    const entityEExpectedData = {
      entity: {
        ...entityE,
        _id: expect.any(String),
        __v: 0,
        typeOfChangeInBranch: EntityCommitChangeType.UPDATE,
        projectBranch: featureBranchB._id,
        createdAtCommit: commitM2._id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        latestEntityCommit: entityCommit19._id,
      },
      entityCommit: {
        ...entityCommit19,
        updatedAt: expect.any(String),
      },
    }
    const entityBExpectedData = {
      entity: {
        ...entityB,
        _id: expect.any(String),
        __v: 0,
        createdAtCommit: commitM2._id,
        updatedAt: expect.any(String),
        latestEntityCommit: entityCommit21._id,
      },
      entityCommit: {
        ...entityCommit3,
        commit: commitM2._id,
        updatedAt: expect.any(String),
        linkedToCommit: true,
      },
    }
    const entityAExpectedData = {
      entity: {
        ...entityA,
        createdAtCommit: commitM1._id,
        _id: expect.any(String),
        __v: 0,
        typeOfChangeInBranch: EntityCommitChangeType.UPDATE,
        projectBranch: featureBranchB._id,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        latestEntityCommit: entityCommit14._id,
      },
      entityCommit: {
        ...entityCommit14,
        updatedAt: expect.any(String),
        linkedToCommit: true,
      },
    }

    expect(branchState.cursor).toEqual({
      skip: 0,
      limit: 30,
      total: 3,
    })
    expect(branchState.data).toContainEqual(entityEExpectedData)
    expect(branchState.data).toContainEqual(entityBExpectedData)
    expect(branchState.data).toContainEqual(entityAExpectedData)
  })

  test.only('Get project state on feature C commit 4', async () => {
    const { body: branchState } = await request(app)
      .get(`${API_PREFIX}/workspaces/${workspace._id}/projects/${project._id}/branches/${featureBranchC._id}/state?commit=${commitC4._id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [cookie])
      .expect('Content-Type', /application\/json/)
      .expect(200)

    const expectedBranchStateCursor = {
      skip: 0,
      limit: 30,
      total: 3,
    }
    const entityAExpectedData = {
      entity: {
        ...entityA,
        _id: expect.any(String),
        __v: 0,
        updatedAt: expect.any(String),
        createdAtCommit: commitM1._id,
        latestEntityCommit: entityCommit18._id,
      },
      entityCommit: {
        ...entityCommit18,
        baseEntityCommit: entityCommit18._id,
        updatedAt: expect.any(String),
        linkedToCommit: true,
      },
    }
    const entityBExpectedData = {
      entity: {
        ...entityB,
        _id: expect.any(String),
        __v: 0,
        updatedAt: expect.any(String),
        createdAtCommit: commitM2._id,
        latestEntityCommit: entityCommit21._id,
      },
      entityCommit: {
        ...entityCommit21,
        baseEntityCommit: entityCommit21._id,
        updatedAt: expect.any(String),
        linkedToCommit: true,
      },
    }
    const entityDExpectedData = {
      entity: {
        ...entityD,
        _id: expect.any(String),
        __v: 0,
        // projectBranch: defaultProjectBranch._id.toString(),
        // typeOfChangeInBranch: 'CREATE',
        createdAtCommit: commitC1._id,
        updatedAt: expect.any(String),
        createdAt: expect.any(String),
        latestEntityCommit: entityCommit12._id,
      },
      entityCommit: {
        ...entityCommit12,
        commit: commitC1._id,
        updatedAt: expect.any(String),
        linkedToCommit: true,
      },
    }

    expect(branchState.cursor).toEqual(expectedBranchStateCursor)
    expect(branchState.data).toContainEqual(entityDExpectedData)
    expect(branchState.data).toContainEqual(entityBExpectedData)
    expect(branchState.data).toContainEqual(entityAExpectedData)
  })
})

