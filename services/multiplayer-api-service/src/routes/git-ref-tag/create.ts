import type { Request, Response, NextFunction } from 'express'
import { ObjectId } from '@multiplayer/mongo'
import { GitRefTagModel } from '@multiplayer/models'
import { IGitRefTag } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const lastCommit = req.lastCommit
    const projectBranchId = req.params.projectBranchId as string
    const _payload: Partial<IGitRefTag> = req.body

    const payload: Partial<IGitRefTag> = {
      ..._payload,
      gitRefTagId: new ObjectId().toString(),
      projectBranch: projectBranchId,
      createdAtCommit: lastCommit._id.toString(),
      workspace: workspaceId,
      project: projectId,
    }

    const projectTag = await GitRefTagModel.createGitRefTag(payload)

    return res.status(200).json(projectTag)
  } catch (err) {
    return next(err)
  }
}
