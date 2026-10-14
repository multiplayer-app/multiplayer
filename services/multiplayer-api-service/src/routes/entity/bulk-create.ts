import type { NextFunction, Request, Response } from 'express'
import { InternalServerError } from 'restify-errors'
import {
  AMQPLib,
  EntityLib,
} from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const {
      workspaceUser,
      projectBranch,
      lastCommit,
    } = req
    if (!workspaceUser || !projectBranch || !lastCommit) {
      throw new InternalServerError('Required data is missed')
    }
    const entities: EntityLib.BulkCreateEntity[] = req.body

    const { added, deleted, commit } = await EntityLib.bulkCreate({
      workspaceId,
      projectId,
      projectBranchId,
      entities,
      workspaceUser,
      projectBranch,
      lastCommit,
    })

    await Promise.all(added.map(({ entity, entityCommit }) =>
      AMQPLib.notifyOnEntityCreate({
        entity: entity.toJSON(),
        entityCommit: entityCommit.toJSON(),
        isDefaultBranch: !!projectBranch.default,
      })))

    await Promise.all(deleted.map(({ entity, entityCommit }) =>
      AMQPLib.notifyOnEntityDelete({
        workspaceId,
        entityId: entityCommit.entity.toString(),
        projectId,
        branchId: projectBranchId,
        isDefaultBranch: !!projectBranch.default,
        entity: entity.toJSON(),
      })))

    commit.entityCommits.forEach((entityCommit: any) => {
      entityCommit.entity = entityCommit.entity.entityId
    })

    return res.status(200).json({
      added,
      deleted,
      commit,
      total: added.length + deleted.length,
    })
  } catch (err) {
    return next(err)
  }
}
