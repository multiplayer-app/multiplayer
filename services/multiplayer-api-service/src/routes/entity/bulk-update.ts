import type { NextFunction, Request, Response } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import { AMQPLib, EntityLib, CommitLib } from '../../lib'
import { CommitType } from '@multiplayer/types'
import { IEntityCommitDocument, IEntityCommitWithEntityDocument } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const {
      workspaceUser,
      projectBranch,
      lastCommit,
    } = req

    if (
      !workspaceUser
      || !projectBranch
      || !lastCommit
    ) {
      throw new InvalidArgumentError('Required data is missing')
    }

    const entities: EntityLib.UpdateEntity[]= req.body

    const updatedEntities = await EntityLib.bulkUpdate(
      projectBranchId,
      entities,
    )

    const entityWithCommits = updatedEntities
      .filter(({ entityCommit, parentBaseChange }) => entityCommit && parentBaseChange) as { entityCommit: IEntityCommitDocument, parentBaseChange: IEntityCommitWithEntityDocument }[]

    if (entityWithCommits.length) {
      await CommitLib.createCommit({
        projectBranch,
        lastCommit,
        entityCommits: entityWithCommits.map(({ entityCommit }) => entityCommit),
        projectBranchState: entityWithCommits.map(({ parentBaseChange }) => parentBaseChange),
        message: 'Bulk update for new entity states',
        label: 'bulk update',
        type: CommitType.AUTO,
        workspaceUsers: [workspaceUser._id.toString()],
      })
    }

    await Promise.all(updatedEntities.map((updatedEntity) =>
      AMQPLib.notifyOnEntityUpdate({
        entity: updatedEntity.entity.toJSON(),
        entityUpdatedAt: updatedEntity.entity.updatedAt || '',
        isDefaultBranch: !!projectBranch.default,
        branchId: projectBranch._id.toString(),
      }),
    ))

    return res.status(200).json(updatedEntities)
  } catch (err) {
    return next(err)
  }
}
