import type { Request, Response, NextFunction } from 'express'
import { CommitType, ErrorMessage, EntityUpdateRequest } from '@multiplayer/types'
import { InternalServerError } from 'restify-errors'
import { slugifyString } from '@multiplayer/util-shared'
import {
  AMQPLib,
  CommitLib,
  EntityLib,
} from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entityId = req.params.entityId as string
    const payload: EntityUpdateRequest = req.body
    const { projectBranch, workspaceUser, lastCommit } = req

    if (!projectBranch || !lastCommit || !workspaceUser) {
      throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
    }

    if (payload.key) {
      payload.key = slugifyString(payload.key)
    }

    if (payload.keyAliases?.length) {
      payload.keyAliases = Array.from(new Set(payload.keyAliases.map(keyAlias => slugifyString(keyAlias)) || []))
    }

    const updatedEntity = await EntityLib.updateEntity(
      entityId,
      projectBranch,
      payload,
    )

    if (
      workspaceUser
      && updatedEntity.entityCommit
      && updatedEntity.parentBaseChange
    ) {
      const commit = await CommitLib.createCommit({
        projectBranch,
        lastCommit,
        entityCommits: [updatedEntity.entityCommit],
        projectBranchState: [updatedEntity.parentBaseChange],
        message: 'Create new entity state in branch',
        label: 'update',
        type: CommitType.AUTO,
        workspaceUsers: [workspaceUser._id.toString()],
      })
    }

    await AMQPLib.notifyOnEntityUpdate({
      entity: updatedEntity.entity.toJSON(),
      entityUpdatedAt: updatedEntity.entity.updatedAt || '',
      isDefaultBranch: !!projectBranch.default,
      branchId: projectBranch._id.toString(),
    })

    return res.status(200).json({
      entityCommit: updatedEntity.entityCommit,
      entity: updatedEntity.entity,
    })
  } catch (err) {
    return next(err)
  }
}
