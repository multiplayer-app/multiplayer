import { NextFunction, Request, Response } from 'express'
import { EntityCommitModel, EntityModel } from '@multiplayer/models'
import { mongoose } from '@multiplayer/mongo'
import { EntityCommitChangeType, ErrorMessage } from '@multiplayer/types'
import { ProjectBranchLib } from '../../lib'
import { NotFoundError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const entityName: string | undefined = req.body.entityName
    const entityCommit = req.entityCommit.toJSON()

    const branchState = await ProjectBranchLib.getProjectBranchState(
      projectBranchId,
      { entityId: entityCommit.entity.toString() },
      { limit: 1 })

    if (branchState.data.length < 1 || !branchState.data[0].entity.project.equals(entityCommit.project)) {
      return next(new NotFoundError(ErrorMessage.ENTITY_NOT_FOUND))
    }
    const entity = branchState.data[0].entity
    const copy = await EntityModel.createEntity({
      ...entity,
      _id: undefined,
      keyAliases: [],
      archived: false,
      createdAtCommit: undefined,
      archivedAtCommit: undefined,
      deletedAtCommit: undefined,
      key: entityName || `Copy of ${entityCommit.meta.entityName} ${entityCommit.createdAt}`,
      metadata: entityCommit.meta.summary,
      entityId: new mongoose.Types.ObjectId(),
      typeOfChangeInBranch: EntityCommitChangeType.CREATE,
      projectBranch: projectBranchId,
    })
    const copyCommit = await EntityCommitModel.createEntityCommit({
      ...entityCommit,
      commit: undefined,
      parentEntityCommit: undefined,
      _id: undefined,
      name: undefined,
      entity: copy.entityId,
      projectBranch: projectBranchId,
      changeType: EntityCommitChangeType.CREATE,
      meta: { ...entityCommit.meta, entityName: copy.key },
    })

    return res.status(200).json({ entity: copy, entityCommit: copyCommit })
  } catch (err) {
    return next(err)
  }
}
