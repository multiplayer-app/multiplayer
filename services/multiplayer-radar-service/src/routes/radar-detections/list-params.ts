import type { Request, Response, NextFunction } from 'express'
import {
  HttpMethod,
  RadarDetectionParamSource,
  RadarDetectionParamDirection,
} from '@multiplayer/types'
import { MongoPayload } from '@multiplayer/util'
import { RadarDetectionService } from '../../services'

interface HttpParamDetectionsFilter {
  workspaceId: string,
  projectId: string,
  endpointId: string,
  environmentName?: string
  paramDirection?: RadarDetectionParamDirection
  paramSource?: RadarDetectionParamSource
  httpMethod?: HttpMethod,
  httpStatus?: number,
  Sign?: number,
  Timestamp?: {
    $lt?: { $date: Date },
    $gt?: { $date: Date }
  }
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const endpointId = req.params.debugSessionId as string

    const {
      beforeTimestamp,
      afterTimestamp,
      environmentName,
      httpStatus,
      Sign,
    } = req.query
    const paramDirection = req.query.paramDirection as RadarDetectionParamDirection
    const paramSource = req.query.paramSource as RadarDetectionParamSource
    const httpMethod = req.query.httpMethod as HttpMethod

    const filter: HttpParamDetectionsFilter = {
      workspaceId,
      projectId,
      endpointId,
      paramDirection,
      paramSource,
      httpMethod,
      environmentName: environmentName as string,
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

    if (httpStatus) {
      filter.httpStatus = Number(httpStatus)
    }
    if (Sign) {
      filter.Sign = Number(Sign)
    }

    const _filter = MongoPayload.removeUndefinedProps(filter)

    // const [
    //   radarDetectionParamsCount,
    //   radarDetectionParams,
    // ] = await Promise.all([
    //   RadarDetectionParamService.getParamDetectionsWithSignCount(_filter as HttpParamDetectionsFilter),
    //   RadarDetectionParamService.listParamDetectionsWithSign(
    //     _filter as HttpParamDetectionsFilter,
    //     {
    //       skip,
    //       limit,
    //     },
    //   ),
    // ])

    const radarDetectionParams = await RadarDetectionService.listParamDetectionsWithSign(
      _filter as HttpParamDetectionsFilter,
    )

    const data = {
      data: radarDetectionParams,
      // cursor: {
      //   skip,
      //   limit,
      //   total: radarDetectionParamsCount,
      // },
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
