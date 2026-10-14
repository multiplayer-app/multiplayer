import type { Request, Response, NextFunction } from 'express'
import { ProjectLinkLib } from '../../lib'
import { IProjectLink } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const lastCommit = req.lastCommit
    const payload = req.body as Partial<IProjectLink>& { archived?: boolean }
    const { archived, ..._payload } = payload

    if (archived) {
      _payload.archivedAtCommit = lastCommit._id.toString()
    }

    const projectLink = await ProjectLinkLib.createProjectLink({
      workspaceId,
      projectId,
      projectBranchId,
      lastCommitId: lastCommit._id.toString(),
      payload: _payload,
    })

    return res.status(200).json(projectLink)
  } catch (err) {
    return next(err)
  }
}
