import type { Request, Response, NextFunction } from 'express'
import { EntityUpdateLib } from '../../lib'
import { EntityUpdateContext, EntityUpdateModel, IProjectBranchDocument } from '@multiplayer/models'
import { DataWithCursor } from '@multiplayer/types'
import { Types } from 'mongoose'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const projectId = req.params.projectId as string
    const workspaceId = req.params.workspaceId as string
    const projectBranch = req.projectBranch

    await commitBranchChanges({
      workspace: workspaceId,
      project: projectId,
      projectBranch: projectBranchId,
    }, projectBranch)

    res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}

export async function commitBranchChanges(filter: {
  workspace: string | Types.ObjectId,
  project: string | Types.ObjectId,
  projectBranch: string | Types.ObjectId,
}, projectBranch: IProjectBranchDocument) {
  const limit = 30
  let skip = 0
  let groups: DataWithCursor<EntityUpdateContext>
  do {
    groups = await EntityUpdateModel.listEntityUpdatesGroups(filter, { skip, limit })

    await Promise.all(groups.data.map((group) => EntityUpdateLib.commitUpdatesIfAvailable(projectBranch, group)))
    skip += limit
  } while (skip < groups.cursor.total)
}
