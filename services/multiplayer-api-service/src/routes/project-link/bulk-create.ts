import type { Request, Response, NextFunction } from 'express'
import {
  IProjectLink,
} from '@multiplayer/types'
import { ProjectLinkLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const lastCommit = req.lastCommit
    const payloads = req.body as (Partial<IProjectLink> & { archived?: boolean })[]

    const _payloads = payloads.map(payload => {
      const { archived, ..._payload } = payload
      if (archived) {
        _payload.archivedAtCommit = lastCommit._id.toString()
      }

      return _payload
    })

    const links = await Promise.all(_payloads.map((payload) => ProjectLinkLib.createProjectLink({
      workspaceId,
      projectId,
      projectBranchId,
      lastCommitId: lastCommit._id.toString(),
      payload,
    })))
    return res.status(200).json(links)
  } catch (err) {
    return next(err)
  }
}
