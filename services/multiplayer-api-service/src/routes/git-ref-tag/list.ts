import type { Request, Response, NextFunction } from 'express'
import { MongoPayload } from '@multiplayer/util'
import {
  IGitRefTag,
  IntegrationTypeEnum,
  GitRefTagType,
} from '@multiplayer/types'
import { GitRefTagLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const projectId = req.params.projectId as string
    const gitRefRepositoryId = req.query.gitRefRepositoryId as string
    const gitRefType = req.query.gitRefType as IntegrationTypeEnum
    const gitRefBranch = req.query.gitRefBranch as string
    const gitRefPath = req.query.gitRefPath as string
    const archived = Boolean(req.query.archived)
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = Number(req.query.sortDirection)
    const sortKey = req.query.sortKey as string
    const type = req.query.type as GitRefTagType

    const cursor: any = {}

    if (!gitRefPath && !gitRefRepositoryId) {
      cursor.skip = skip
      cursor.limit = limit
    }

    const filter: Partial<IGitRefTag> & {
      archived?: boolean
      gitRefRepositoryId?: string
      gitRefBranch?: string
      gitRefPath?: string
      gitRefType?: IntegrationTypeEnum
      type?: GitRefTagType
    } = {
      archived,
      gitRefRepositoryId,
      gitRefBranch,
      gitRefPath,
      gitRefType,
      project: projectId,
      type,
    }

    const gitRefTags = await GitRefTagLib.getGitRefTagState(
      projectBranchId,
      MongoPayload.removeUndefinedProps(filter),
      cursor,
      {
        sortKey,
        sortDirection,
      },
    )

    return res.status(200).json(gitRefTags)
  } catch (err) {
    return next(err)
  }
}
