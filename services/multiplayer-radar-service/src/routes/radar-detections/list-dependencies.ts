import type { Request, Response, NextFunction } from 'express'
import {
  RadarDetectionType,
  RadarDetectionEndpointType,
  RadarDetectionSource,
} from '@multiplayer/types'
import { MongoPayload } from '@multiplayer/util'
import { ClickHouseTypes } from '@multiplayer/clickhouse'
import { RadarDetectionService } from '../../services'
import { RadarDetectionQueryFilter } from '../../types'
import { transformClickhouseStream } from '../../helpers'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : 0
    const limit = 'limit' in req.query ? Number(req.query.limit) : 30
    const sortDirections = req.query.sortDirection as ClickHouseTypes.ClickHouseSortOrder[] | undefined
    const sortKeys = req.query.sortKey as string[] | undefined
    const {
      beforeTimestamp,
      afterTimestamp,
    } = req.query
    const Sign = req.query.Sign as RadarDetectionSource | RadarDetectionSource[] | undefined

    const componentNames = req.query.componentNames as string[] | undefined
    const environmentNames = req.query.environmentNames as string[] | undefined
    const tags = req.query.tags as string[] | undefined
    const platformIds = req.query.platformIds as string[] | undefined
    const endpointType = req.query.endpointType as RadarDetectionEndpointType[] | undefined
    const sourceComponentNames = req.query.sourceComponentNames as string[] | undefined
    const sourceEndpointType = req.query.sourceEndpointType as RadarDetectionEndpointType[] | undefined
    const targetComponentNames = req.query.targetComponentNames as string[] | undefined
    const targetEndpointType = req.query.targetEndpointType as RadarDetectionEndpointType[] | undefined
    const text = req.query.text as string | undefined


    let sortOptions: ClickHouseTypes.ISortOptions[] = []

    if (sortDirections && sortKeys) {
      sortOptions = sortDirections?.map((sortDirection, index) => ({
        sortDirection: sortDirection,
        sortKey: sortKeys[index],
      }))
    }


    const filter: RadarDetectionQueryFilter = {
      workspaceId,
      projectId,
      type: RadarDetectionType.DEPENDENCY,
      Sign,
      // componentName,
      endpointType,
      sourceEndpointType,
      targetEndpointType,
      // sourceComponentName,
      // targetComponentName,
    }

    if (environmentNames) {
      filter.environmentNames = {
        $columnType: 'array',
        $value: environmentNames,
      }
    }

    if (platformIds) {
      filter.platformIds = {
        $columnType: 'array',
        $value: platformIds,
      }
    }

    if (beforeTimestamp || afterTimestamp) {
      filter.Timestamp = {}

      if (beforeTimestamp) {
        filter.Timestamp.$lt = {
          $date: new Date(beforeTimestamp as string),
        }
      }
      if (afterTimestamp) {
        filter.Timestamp.$gt = {
          $date: new Date(afterTimestamp as string),
        }
      }
    }

    if (text) {
      filter.$or = [{
        componentName: { $like: text },
      }, {
        sourceComponentName: { $like: text },
      }, {
        targetComponentName: { $like: text },
      }, {
        httpMethod: { $like: text },
      }, {
        httpEndpoint: { $like: text },
      }, {
        sourceHttpMethod: { $like: text },
      }, {
        sourceHttpEndpoint: { $like: text },
      }, {
        targetHttpMethod: { $like: text },
      }, {
        targetHttpEndpoint: { $like: text },
      }]
    }

    if (tags) {
      const formattedTags = tags.map(tag => {
        const [,key, value] = tag.match(/^(?<KEY>[^:]*):(?<VALUE>.+)$/) || []

        return {
          ...key ? { '1': key } : {},
          '2': value,
        }
      })

      filter.tags = { $arrayExists: formattedTags }
    }

    const _filter = MongoPayload.removeUndefinedProps(filter) as RadarDetectionQueryFilter

    if (componentNames?.length) {
      _filter.componentName = { $or: componentNames }
    }
    if (sourceComponentNames?.length) {
      _filter.sourceComponentName = { $or: sourceComponentNames }
    }
    if (targetComponentNames?.length) {
      _filter.targetComponentName = { $or: targetComponentNames }
    }

    const [
      totalRadarDetectedDepndenciesCount,
      radarDetectedDependenciesStream,
    ] = await Promise.all([
      RadarDetectionService.getRadarDetectedDependenciesCount(_filter),
      RadarDetectionService.listRadarDetectedDependencies(
        _filter,
        {
          skip,
          limit,
        },
        sortOptions,
      ),
    ])

    const cursor = {
      skip,
      limit,
      total: totalRadarDetectedDepndenciesCount,
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    })

    return radarDetectedDependenciesStream
      .pipe(transformClickhouseStream(cursor))
      .pipe(res)
  } catch (err) {
    return next(err)
  }
}
