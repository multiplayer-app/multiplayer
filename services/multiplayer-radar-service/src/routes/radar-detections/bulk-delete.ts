import type { Request, Response, NextFunction } from 'express'
import {
  RadarDetectionSource,
  RadarDetectionType,
} from '@multiplayer/types'
import {
  RadarDetectionService,
} from '../../services'
import { ApplyDetection } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const workspaceUser = req.workspaceUser
    const cookie = req.headers.cookie

    const {
      Sign,
      type,
      ids,
    } = req.body as {
      ids?: string[],
      type?: RadarDetectionType,
      Sign: RadarDetectionSource
    }

    const detectionsFilter: {
      workspaceId: string
      projectId: string
      Sign?: RadarDetectionSource[] | RadarDetectionSource,
      id?: { $or: string[] },
      type?: RadarDetectionType | { $or: RadarDetectionType[] }
    } = {
      workspaceId,
      projectId,
    }

    const detectionParamsFilter: {
      workspaceId: string
      projectId: string
      Sign?: RadarDetectionSource[] | RadarDetectionSource,
      endpointId?: { $or: string[] },
    } = {
      workspaceId,
      projectId,
    }

    if (ids?.length) {
      detectionsFilter.id = { $or: ids }
      detectionParamsFilter.endpointId = { $or: ids }
    }

    if (type) {
      detectionsFilter.type = type
    }

    if ([RadarDetectionSource.SYNCED, RadarDetectionSource.DOCS].includes(Sign)) {
      await ApplyDetection.unapplyDetections(
        workspaceId,
        projectId,
        {
          ids,
          type,
        },
        workspaceUser?._id?.toString() as string,
        cookie as string,
      )
    }

    if ([
      RadarDetectionSource.RADAR,
      RadarDetectionSource.SYNCED,
    ].includes(Sign)) {
      if (Sign === RadarDetectionSource.SYNCED) {
        detectionsFilter.Sign = [
          RadarDetectionSource.DOCS,
          RadarDetectionSource.RADAR,
        ]
      } else {
        detectionsFilter.Sign = Sign

        detectionParamsFilter.Sign = Sign
      }

      if (detectionsFilter.type === RadarDetectionType.SERVICE) {
        detectionsFilter.type = {
          $or: [
            RadarDetectionType.SERVICE,
            RadarDetectionType.DEPENDENCY,
            RadarDetectionType.ENDPOINT,
          ],
        }
      }

      const promises = [
        RadarDetectionService.deleteDetections(detectionsFilter),
      ]

      if (
        ids?.some(id => id.split(':')[2] === RadarDetectionType.ENDPOINT)
        || type === RadarDetectionType.ENDPOINT
      ) {
        promises.push(RadarDetectionService.deleteParamDetections(detectionParamsFilter))
      }

      await Promise.all(promises)
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
