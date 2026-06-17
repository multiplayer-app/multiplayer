import type { NextFunction, Request, Response } from 'express'
import { Config as ModelConfig } from '@multiplayer/models'
import { EntityType } from '@multiplayer/types'
import { MongoPayload } from '@multiplayer/util'
import { ProjectBranchStateParams } from '@multiplayer/types'
// import { SessionRecorderSdk } from '@multiplayer-app/session-recorder-node'
import { ProjectBranchLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const query: ProjectBranchStateParams = req.query
    const archived = Boolean(query.archived)
    const commit = query.commit
    const entityType = query.entityType
    const changeType = query.changeType
    const entityId = query.entityId
    const key = query.key
    const sortDirection = Number(query.sortDirection || 1)
    const sortKey = query.sortKey
    const hasUncommittedSource = Boolean(query.hasUncommittedSource)
    const tags = req.query.tags as string[] | undefined
    const _default = req.query.default as boolean | undefined
    const skip = 'skip' in query ? Number(req.query.skip) : undefined
    const limit = 'limit' in query? Number(req.query.limit) : undefined
    const cursor = {
      skip: skip || ModelConfig.SKIP,
      limit: limit || ModelConfig.LIMIT,
    }

    const filter: any = {
      archived,
      type: entityType as EntityType,
      changeType: changeType as string,
      entityId: entityId as string | string[],
      key,
      commit,
      hasUncommittedSource,
      default: typeof _default === 'boolean' ? Boolean(_default) : undefined,
    }

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

    const branchState = await ProjectBranchLib.getProjectBranchState(
      projectBranchId,
      MongoPayload.removeUndefinedProps(filter),
      cursor,
      sortDirection && sortKey ? { sortKey, sortDirection } : undefined,
    )

    branchState.data.forEach((data) => {
      // check if commit info comes from parentBranch, replace baseEntityCommit, for valid changes calculation
      if (!data.entity.projectBranch.equals(projectBranchId) && data.entityCommit) {
        data.entityCommit.baseEntityCommit = data.entityCommit._id
      }
    })

    // setTimeout(() => {
    //   SessionRecorderSdk.captureException(new Error(`test error ${Date.now()}`))
    // }, 15000)

    return res.status(200).json(branchState)
  } catch (err) {
    return next(err)
  }
}
