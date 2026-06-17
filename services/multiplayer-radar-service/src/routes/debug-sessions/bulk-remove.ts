import type { Request, Response, NextFunction } from 'express'
import { DebugSessionModel } from '@multiplayer/models'
import { s3 } from '@multiplayer/s3'
import { DebugSessionCreationReasonType } from '@multiplayer/types'
import { DebugSessionService, MetricsService } from '../../services'
import { S3_DEBUG_SESSIONS_BUCKET } from '../../config'
import { DebugSessionHelper } from '../../helpers'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const _debugSessionIds = req.body.ids as string[] | undefined

    const issueHash = req.body.issueHash as string | undefined
    const issueTitleHash = req.body.issueTitleHash as string | undefined
    const issueComponentHash = req.body.issueComponentHash as string | undefined
    const issueCustomHash = req.body.issueCustomHash as string | undefined

    const tags = req.body.tags as string[] | undefined
    const starred = req.body.starred as boolean | undefined
    const live = req.body.live as boolean | undefined
    const creationReason = req.body.creationReason as DebugSessionCreationReasonType | undefined
    const fromContinuousDebugSession = req.body.fromContinuousDebugSession as boolean | undefined

    let _ids: string[] | undefined

    if (Object.keys(req.body).length) {
      const filters: any = {
        workspace: workspaceId,
        project: projectId,
        starred,
        creationReason,
        fromContinuousDebugSession,
        issueHash,
        issueTitleHash,
        issueComponentHash,
        issueCustomHash,
      }

      if (typeof fromContinuousDebugSession === 'boolean') {
        filters.continuousDebugSession = { $exists: fromContinuousDebugSession }
      }

      if (typeof live === 'boolean') {
        filters.stoppedAt = { $exists: !live }
      }

      if (tags) {
        const formattedTags = (tags as string[]).map(tag => {
          const [,key, value] = tag.match(/^(?<KEY>[^:]*):(?<VALUE>.+)$/) || []

          return {
            ...key ? { key }: {},
            value,
          }
        })

        filters.tags = formattedTags
      }

      if (_debugSessionIds?.length) {
        filters._id = _debugSessionIds
      }

      const { data: __debugSessionIds } = await DebugSessionModel.findDebugSessions(
        filters,
        undefined,
        undefined,
        { _id: 1 },
      )

      _ids = __debugSessionIds.map(({ _id }) => _id.toString())
    }

    await Promise.all([
      DebugSessionService.bulkDeleteLogsByDebugSessionId(
        workspaceId,
        projectId,
        _ids,
      ),
      DebugSessionService.bulkDeleteTracesByDebugSessionId(
        workspaceId,
        projectId,
        _ids,
      ),
      DebugSessionService.bulkDeleteRrwebEventsDebugSessionById(
        workspaceId,
        projectId,
        _ids,
      ),
      MetricsService.removeMetricsForSessionRecordings({
        workspaceId,
        projectId,
        sessionRecordingId: _ids,
      }),
      _ids?.length
        ? Promise.all(_ids.map(debugSessionId =>
          s3.deleteObjectsByPrefix(
            S3_DEBUG_SESSIONS_BUCKET,
            DebugSessionHelper.getS3DebugSessionFolder({
              workspaceId,
              projectId,
              debugSessionId,
            }),
          ),
        ))
        : s3.deleteObjectsByPrefix(
          S3_DEBUG_SESSIONS_BUCKET,
          DebugSessionHelper.getS3ProjectDebugSessionFolder({
            workspaceId,
            projectId,
          }),
        ),
    ])

    await DebugSessionModel.bulkDeleteDebugSessions(
      workspaceId,
      projectId,
      _ids,
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
