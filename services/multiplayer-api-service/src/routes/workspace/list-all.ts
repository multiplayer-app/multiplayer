import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel, SortOrder } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const archived = Boolean(req.query.archived)
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query ? Number(req.query.limit) : undefined
    const sortKey = req.query.sortKey as string | undefined
    const sortDirection = req.query.sortDirection as SortOrder | undefined
    const text = req.query.text as string | undefined

    const filter: {
      archived?: boolean,
      text?: string,
    } = {
      archived,
    }

    if (text) {
      filter.text = text
    }

    const sort = sortKey && sortDirection ? {
      sortKey,
      sortDirection,
    } : undefined

    const workspaces = await WorkspaceModel.findWorkspaces(
      filter,
      {
        skip,
        limit,
      },
      sort,
    )

    return res.status(200).json(workspaces)
  } catch (err) {
    return next(err)
  }
}