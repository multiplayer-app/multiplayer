import type { Request, Response, NextFunction } from 'express'
import { FlowMetadataModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      skip: _skip,
      limit: _limit,
      sortDirection: _sortDirection,
      sortKey: _sortKey,
      tags,
      ...filter
    } = req.query

    const skip = _skip ? Number(_skip) : 0
    const limit = _limit ? Number(_limit) : 30
    const sortDirection = Number(_sortDirection)
    const sortKey = _sortKey as string

    if (tags) {
      const formattedTags = (tags as string[]).map(tag => {
        const [,key, value] = tag.match(/^(?<KEY>[^:]*):(?<VALUE>.+)$/) || []

        return {
          ...key ? { key }: {},
          value,
        }
      })

      filter.tags = formattedTags
    }

    let cursor: any = undefined

    if (skip && limit) {
      cursor = {
        skip,
        limit,
      }
    }

    const flowsMetadata = await FlowMetadataModel.findFlowsMetadata({
      workspace: workspaceId,
      project: projectId,
      ...(filter || {}),
    }, {
      skip,
      limit,
    }, {
      sortKey,
      sortDirection,
    })

    return res.status(200).json(flowsMetadata)
  } catch (err) {
    return next(err)
  }
}
