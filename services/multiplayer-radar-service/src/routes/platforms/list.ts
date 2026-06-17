import type { NextFunction, Request, Response } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  Config as ModelConfig,
  ProjectBranchModel,
  EntityModel,
} from '@multiplayer/models'
import {
  EntityType,
  ErrorMessage,
  RadarDetectionType,
  RadarDetectionSource,
} from '@multiplayer/types'
import { RadarDetectionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = Number(req.query.sortDirection || '1')
    const sortKey = req.query.sortKey as string
    const key = req.query.key as string | undefined
    const text = req.query.text as string | undefined
    const tags = req.query.tags as string[] | undefined
    const environmentNames = req.query.environmentNames as string[] || []
    const _default = req.query.default as boolean | undefined

    const cursor = {
      skip: skip || ModelConfig.SKIP,
      limit: limit || ModelConfig.LIMIT,
    }

    const defaultProjectBranch = await ProjectBranchModel.getDefaultProjectBranch(projectId)

    if (!defaultProjectBranch) {
      throw new NotFoundError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND)
    }

    const radarDetectedEnvironments = await RadarDetectionService.getRadarDetectionsWithoutDuplicates({
      workspaceId,
      projectId,
      type: RadarDetectionType.ENVIRONMENT,
      Sign: RadarDetectionSource.RADAR,
      ...environmentNames?.length ? { environmentName: environmentNames } : {},
    })

    const filter: any = {
      workspace: workspaceId,
      project: projectId,
      projectBranch: defaultProjectBranch._id,
      type: EntityType.PLATFORM,
      key,
      hasUncommittedSource: false,
      text,
      default: _default,
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

    if (environmentNames?.length) {
      filter.entityId = radarDetectedEnvironments
        .map(_env => _env.platformId)
        .filter(_id => _id?.length)
    }

    const platformsWithCursor = await EntityModel.findEntities(
      filter,
      cursor,
      { sortKey, sortDirection },
    )

    const data = {
      data: platformsWithCursor.data.map(entity => {
        const radarDetectedEnvironment = radarDetectedEnvironments
          .find(_env => entity.entityId.equals(_env.platformId))

        if (radarDetectedEnvironment) {
          (entity as any).environmentNames = [...new Set([
            ...((entity as any).environmentNames || []),
            radarDetectedEnvironment.environmentName,
          ])]
        }

        return { entity }
      }),
      cursor: platformsWithCursor.cursor,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
