import { EntityModel, EntityUpdateModel, IProjectBranchDocument, ProjectBranchModel } from '../src'
import { ObjectId } from '@multiplayer/mongo'
import { EntityCommitChangeType, EntityType, ProjectBranchStatus, ProjectBranchType } from '@multiplayer/types'

describe('ProjectBranchModel', () => {
  const workspace = new ObjectId()
  const project =new ObjectId()

  afterAll(async () => {
    await ProjectBranchModel.deleteProjectBranchesByWorkspace(workspace)
    await EntityModel.deleteEntitiesByWorkspace(workspace)
    await EntityUpdateModel.deleteEntityUpdatesByWorkspace(workspace)
  })

  describe('#findDependentProjectBranchesWithUnchangedEntity', () => {
    let parentBranch: IProjectBranchDocument
    beforeEach(async () => {
      parentBranch = await ProjectBranchModel.createProjectBranch({
        workspace, project,
        name: 'main',
        status: ProjectBranchStatus.IN_PROGRESS,
        type: ProjectBranchType.FEATURE,
        default: true,
      })
    })

    afterEach(async () => {
      await ProjectBranchModel.deleteProjectBranchById(parentBranch._id)
    })

    it('should return nothing if entity exists in child branch', async () => {
      const entityInParent = await EntityModel.createEntity({
        entityId: new ObjectId(),
        workspace, project,
        projectBranch: parentBranch._id,
        type: EntityType.PLATFORM,
        key: 'testEntity',
        typeOfChangeInBranch: EntityCommitChangeType.CREATE,
      })

      const branch = await ProjectBranchModel.createProjectBranch({
        workspace, project,
        name: 'test1',
        status: ProjectBranchStatus.IN_PROGRESS,
        type: ProjectBranchType.FEATURE,
        default: false,
        parentProjectBranch: parentBranch._id,
      })
      const entityInChild = await EntityModel.createEntity({
        ...entityInParent.toJSON(),
        projectBranch: branch._id,
        typeOfChangeInBranch: EntityCommitChangeType.UPDATE,
      })

      const branches = await ProjectBranchModel.findDependentProjectBranchesWithUnchangedEntity(parentBranch._id, entityInParent.entityId)
      expect(branches.length).toBe(0)
    })
    it('should return nothing if entity has non-committed updates', async () => {
      const entityInParent = await EntityModel.createEntity({
        entityId: new ObjectId(),
        workspace, project,
        projectBranch: parentBranch._id,
        type: EntityType.PLATFORM,
        key: 'testEntity',
        typeOfChangeInBranch: EntityCommitChangeType.CREATE,
      })

      const branch = await ProjectBranchModel.createProjectBranch({
        workspace, project,
        name: 'test2',
        status: ProjectBranchStatus.IN_PROGRESS,
        type: ProjectBranchType.FEATURE,
        default: false,
        parentProjectBranch: parentBranch._id,
      })

      await EntityUpdateModel.createEntityUpdate({
        workspace: parentBranch.workspace.toString(),
        project: parentBranch.project.toString(),
        projectBranch: branch._id.toString(),
        entityId: entityInParent.entityId.toString(),
        update: Buffer.from(new Uint8Array([0,1])),
      })
      const branches = await ProjectBranchModel.findDependentProjectBranchesWithUnchangedEntity(parentBranch._id, entityInParent.entityId)
      expect(branches.length).toBe(0)
    })
    it('should return branches where entity does not exist', async () => {
      const entityInParent = await EntityModel.createEntity({
        entityId: new ObjectId(),
        workspace, project,
        projectBranch: parentBranch._id,
        type: EntityType.PLATFORM,
        key: 'testEntity',
        typeOfChangeInBranch: EntityCommitChangeType.CREATE,
      })

      const branch = await ProjectBranchModel.createProjectBranch({
        workspace, project,
        name: 'test3',
        status: ProjectBranchStatus.IN_PROGRESS,
        type: ProjectBranchType.FEATURE,
        default: false,
        parentProjectBranch: parentBranch._id,
      })
      const branches = await ProjectBranchModel.findDependentProjectBranchesWithUnchangedEntity(parentBranch._id, entityInParent.entityId)
      expect(branches.length).toBe(1)
      expect(branches[0]._id).toEqual(branch._id)
    })
  })
})
