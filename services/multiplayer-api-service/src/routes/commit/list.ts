import type { Request, Response, NextFunction } from 'express'
import { CommitModel } from '@multiplayer/models'
import { MongoPayload } from '@multiplayer/util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const after = req.query.after as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const filter: {
      after?: string | Date,
      projectBranch: string,
      project: string,
      workspace: string
    } = {
      workspace: workspaceId,
      project: projectId,
      after,
      projectBranch: projectBranchId,
    }

    const commits = await CommitModel.findCommits(
      MongoPayload.removeUndefinedProps(filter) as {
        after?: any,
        projectBranch: any,
        project: any,
        workspace: any
      },
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(commits)
  } catch (err) {
    return next(err)
  }
}
