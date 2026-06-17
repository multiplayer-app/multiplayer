import { metrics } from '@multiplayer/apm'
import logger from '@multiplayer/logger'
import redis from '@multiplayer/redis'
import {
  IssueModel,
  IssueEndUserModel,
  IIssueDocument,
  ProjectModel,
  DebugSessionModel,
} from '@multiplayer/models'
import { Timer } from '@multiplayer/util'
import { ObjectId } from '@multiplayer/mongo'
import { NotFoundError } from 'restify-errors'
import {
  ATTR_MULTIPLAYER_INTEGRATION_ID,
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_SESSION_ID,
  MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX,
  MULTIPLAYER_TRACE_CLIENT_ID_LENGTH,
  MULTIPLAYER_TRACE_SESSION_PREFIX,
  ATTR_MULTIPLAYER_ISSUE_HASH,
  SessionType,
} from '@multiplayer-app/session-recorder-node'
import {
  ErrorMessage,
  IssueSeverityLevel,
  IIssue,
  IssueGroupBy,
  AgentChatStartReasonEnum,
  IEndUser,
  OtelSpanCh,
  IDebugSession,
} from '@multiplayer/types'
import * as MetricsService from './metrics.service'
import * as DebugSessionService from './debug-session.service'
import * as ContinuousDebugSessionService from './continuous-debug-session.service'
import * as EndUserService from './end-user.service'
import * as ReleaseService from './release.service'
import * as AlertService from './alert.service'
import * as IssueSettingsLib from '../libs/issue-settings.lib'
import { OtlpLib } from '../libs'
import {
  SessionRecordingIssueThrottleCache,
  OtelSpanIdCache,
} from '../cache'
import { InternalGitService } from './internal-git.service'
import * as IntegrationService from './integration.service'
import * as AgentService from './agent.service'
import {
  FRONTEND_DOMAIN,
  FRONTEND_PROTOCOL,
  REDIS_ISSUE_RESOLVE_LOCK_PREFIX,
  REDIS_ISSUE_RESOLVE_LOCK_TTL,
} from '../config'
import {
  IExportTraceServiceRequest,
  ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH,
  ATTR_MULTIPLAYER_ISSUE_TITLE_HASH,
} from '../types'

const totalErrorSpansCounter = metrics.createCounter('processed_error_spans_total')
const processingErrorSpansErrorRate = metrics.createCounter('processing_error_spans_error_rate')
const processingErrorSpansDuration = metrics.createHistogram(
  'processing_error_spans_duration',
  {
    unit: 'ms',
  },
)

export const getIssueUrl = async (issue: IIssue): Promise<string> => {
  const project = await ProjectModel.findProjectById(issue.project)

  if (!project) {
    throw new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND)
  }

  return `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}${project?.access?.guest?.enabled ? '/public' : ''}/project/${issue.workspace}/${issue.project}/default/issues/issue/${issue.titleHash}?componentHash=${issue.componentHash}`
}

export const removeIssue = async (issueId: string) => {
  const issue = await IssueModel.findIssueById(issueId)

  if (!issue) {
    throw new NotFoundError(ErrorMessage.ISSUE_NOT_FOUND)
  }

  await IssueEndUserModel.bulkDeleteIssuesEndUsersByIssue(
    issue.workspace,
    issue.project,
    {
      ids: [issueId],
    },
  )

  await IssueModel.deleteIssueById(issueId)

  await MetricsService.removeMetricsByIssueHash({
    workspaceId: issue.workspace.toString(),
    projectId: issue.project.toString(),
    issueHash: [issue.hash],
  })

  await SessionRecordingIssueThrottleCache.del(
    issue.workspace.toString(),
    issue.project.toString(),
    issue.hash,
  )
}

export const bulkRemoveIssues = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter: {
    ids?: string[] | ObjectId[],
    hash?: string[],
    titleHash?: string[],

    resolved?: boolean,
    archived?: boolean,
    severity?: IssueSeverityLevel,
    title?: string,
    'service.serviceNameSlug'?: string,
    'service.environmentSlug'?: string,
    'lastSeen.gte'?: string | Date,
    'lastSeen.lte'?: string | Date,
    text?: string,
  },
) => {
  const { data: _issueHashes } = await IssueModel.findIssues(
    {
      ...filter,
      workspace: workspaceId,
      project: projectId,
    },
    undefined,
    undefined,
    undefined,
    { hash: 1, componentHash: 1 },
  )

  await IssueModel.bulkDeleteIssues(
    workspaceId,
    projectId,
    filter,
  )

  await IssueEndUserModel.bulkDeleteIssuesEndUsersByIssue(
    workspaceId,
    projectId,
    filter,
  )

  const hashes = _issueHashes.map(issue => issue.hash)

  if (hashes.length) {
    await MetricsService.removeMetricsByIssueHash({
      workspaceId: workspaceId.toString(),
      projectId: projectId.toString(),
      issueHash: hashes,
    })
    await Promise.all(
      hashes.map(hash =>
        SessionRecordingIssueThrottleCache.del(
          workspaceId.toString(),
          projectId.toString(),
          hash,
        ),
      ),
    )
  }
}

export const createIssue = async (payload: Partial<IIssue>) => {
  const existingIssue = await IssueModel.findIssueByComponentHash(
    payload.componentHash as string,
  )

  if (existingIssue) {
    payload.archived = existingIssue.archived || false
    payload.resolved = existingIssue.resolved || false
    payload.solution = existingIssue.solution || undefined
    if (payload.fixabilityScore === undefined) {
      payload.fixabilityScore = existingIssue.fixabilityScore
    }
  }

  const issue = await IssueModel.createIssue(payload)

  return issue
}

export const getIssueByComponentHash = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  componentHash: string,
): Promise<IIssue | undefined> => {
  const { data: [issue] } = await IssueModel.findIssues(
    {
      workspace: workspaceId,
      project: projectId,
      componentHash,
    },
    {
      skip: 0,
      limit: 1,
    },
    undefined,
    IssueGroupBy.COMPONENT_HASH,
  )

  return issue as any as IIssue
}

export const getIssueByTitleHash = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  titleHash: string,
): Promise<IIssue | undefined> => {
  const { data: [issue] } = await IssueModel.findIssues(
    {
      workspace: workspaceId,
      project: projectId,
      titleHash,
    },
    {
      skip: 0,
      limit: 1,
    },
    undefined,
    IssueGroupBy.TITLE_HASH,
  )

  return issue as any as IIssue
}

export const createPrForIssue = async (
  issue: IIssue,
  repositoryUrl: string,
  branchName: string,
  prContent: {
    title: string;
    body: string
  },
): Promise<string> => {
  const gitService = new InternalGitService()
  const prResponse = await gitService.createPullRequest(
    issue.workspace,
    issue.project,
    {
      repositoryUrl,
      branchName,
      // baseBranch,
      title: prContent.title,
      description: prContent.body,
    },
  )

  const prUrl = prResponse.prUrl

  return prUrl
}

export const handleIssueInTraceRequest = async (
  traceRequest: IExportTraceServiceRequest,
  insertSpans: boolean,
): Promise<{
  spanIssueMap: Record<string, IIssueDocument | IIssue>
  debugSession: IDebugSession | undefined
}> => {
  const traceId = traceRequest.resourceSpans?.[0]?.scopeSpans?.[0]?.spans?.[0]?.traceId as string

  const startTime = Timer.startTimer()
  const spansCount = traceRequest.resourceSpans?.length || 0
  totalErrorSpansCounter.add(spansCount)
  try {
    let spans = OtlpLib.convertExportTraceToCh(traceRequest)

    const sessionType = OtlpLib.getSessionTypeFromTraceId(traceId)

    if (!sessionType) {
      logger.warn({ traceId }, '[OTEL-ERROR-TRACE] Missing session type in trace')
      return {
        spanIssueMap: {},
        debugSession: undefined,
      }
    }

    spans = spans.filter(OtlpLib.isErrorSpan)

    if (!spans.length) {
      return {
        spanIssueMap: {},
        debugSession: undefined,
      }
    }

    const workspaceId = spans[0].SpanAttributes[ATTR_MULTIPLAYER_WORKSPACE_ID]
    if (!workspaceId) {
      logger.error({ traceId }, '[OTEL-ERROR-TRACE] Missing workspace id in trace')
      return {
        spanIssueMap: {},
        debugSession: undefined,
      }
    }

    const projectId = spans[0].SpanAttributes[ATTR_MULTIPLAYER_PROJECT_ID]
    if (!projectId) {
      logger.error({ traceId }, '[OTEL-ERROR-TRACE] Missing project id in trace')
      return {
        spanIssueMap: {},
        debugSession: undefined,
      }
    }

    const integrationId = spans[0]?.SpanAttributes?.[ATTR_MULTIPLAYER_INTEGRATION_ID]
    if (!integrationId) {
      logger.error({ traceId }, '[OTEL-ERROR-TRACE] Missing integration id in trace')
      return {
        spanIssueMap: {},
        debugSession: undefined,
      }
    }

    await IntegrationService.upsertOtelIntegrationStatus(
      integrationId,
      { otelSpans: true },
    )

    let clientId: string | undefined
    // const issues: IIssueDocument[] = []
    const spanIssueMap: Record<string, IIssueDocument | IIssue> = {}
    let spansWithError: OtelSpanCh[] = []
    let endUser: IEndUser | undefined
    let debugSession = await DebugSessionService.getDebugSessionFromTraceId(
      workspaceId,
      projectId,
      traceId,
    )

    if (
      traceId.startsWith(MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX)
      || traceId.startsWith(MULTIPLAYER_TRACE_SESSION_PREFIX)
    ) {
      clientId = traceId.substring(
        MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX.length,
        MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX.length +
        MULTIPLAYER_TRACE_CLIENT_ID_LENGTH * 2,
      )
      endUser = await EndUserService.findEndUserByClientId(clientId)
    }

    for (const _spanWithError of spans) {
      let _issue: IIssue | IIssueDocument | undefined = OtlpLib.getIssueFromSpan(_spanWithError)

      if (!_issue) {
        continue
      }

      const shouldCreateIssue = await IssueSettingsLib.shouldCreateIssue(_issue, integrationId)

      if (!shouldCreateIssue) {
        logger.debug({
          traceId: _spanWithError.TraceId,
          spanId: _spanWithError.SpanId,
          category: _issue.category,
          issueHash: _issue.hash,
          issueComponentHash: _issue.componentHash,
          issueTitleHash: _issue.titleHash,
        }, '[OTEL-ERROR-TRACE] Issue category not in create only for categories')
        continue
      }

      const isAlreadyProcessed = await OtelSpanIdCache.get(
        workspaceId,
        projectId,
        _spanWithError.TraceId as string,
        _spanWithError.SpanId as string,
      )


      if (isAlreadyProcessed) {
        spanIssueMap[_spanWithError.SpanId] = _issue
        continue
      }

      await OtelSpanIdCache.set(
        workspaceId,
        projectId,
        _spanWithError.TraceId as string,
        _spanWithError.SpanId as string,
      )


      const shouldThrottleSessionRecordingCreation = await SessionRecordingIssueThrottleCache.get(
        workspaceId,
        projectId,
        _issue.hash,
      )

      logger.debug({
        traceId: _spanWithError.TraceId,
        spanId: _spanWithError.SpanId,
        category: _issue.category,
        issueHash: _issue.hash,
        issueComponentHash: _issue.componentHash,
        issueTitleHash: _issue.titleHash,
        shouldThrottleSessionRecordingCreation,
      }, '[OTEL-ERROR-TRACE] Issue throttling info')

      // console.dir({
      //   t: '=======ISSUE_HANDLER========',
      //   ...JSON.parse(JSON.stringify({
      //     _issue,
      //     shouldThrottleSessionRecordingCreation,
      //     debugSession: debugSession || false,
      //     insertSpans,
      //   })),
      // }, { depth: null, colors: true })

      if (
        !debugSession
        && shouldThrottleSessionRecordingCreation
      ) {
        // create issue rate metric and end user <-> issue relation for throttled issue
        // for non throttled issue, it will be created in the next step
        const promises: Promise<any>[] = [
          MetricsService.createIssueRateMetric(
            _issue,
            {
              endUserHash: endUser?.hash,
              // debugSessionId: debugSession?._id,
            },
          ),
        ]

        if (endUser) {
          promises.push(IssueEndUserModel.createIssueEndUser({
            workspace: workspaceId,
            project: projectId,
            issue: _issue,
            endUser,
          }))
        }

        await Promise.all(promises)

        continue
      }


      _issue.integration = integrationId
      _issue = await createIssue(_issue)
      // issues.push(_issue as IIssueDocument)
      spanIssueMap[_spanWithError.SpanId] = _issue

      await SessionRecordingIssueThrottleCache.set(
        workspaceId,
        projectId,
        _issue.hash,
      )

      if (!debugSession) {
        const _createDebugSessionResult = await DebugSessionService.createDebugSessionForIssue(
          _issue.toObject(),
          _spanWithError,
          clientId,
        )

        debugSession = _createDebugSessionResult.debugSession
        endUser = _createDebugSessionResult.endUser

        if (endUser) {
          await MetricsService.createSessionRecordingRateMetric(
            workspaceId,
            projectId,
            debugSession._id,
            endUser.hash,
          )
        }
      }

      if (_issue.resolved || _issue.archived) {
        await MetricsService.createIssueRateMetric(
          _issue.toObject(),
          {
            endUserHash: endUser?.hash,
            debugSessionId: debugSession._id,
          },
        )
        continue
      }

      _spanWithError.SpanAttributes[ATTR_MULTIPLAYER_SESSION_ID] = debugSession._id
      _spanWithError.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_HASH] = _issue.hash
      _spanWithError.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH] = _issue.componentHash
      _spanWithError.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_TITLE_HASH] = _issue.titleHash

      spansWithError.push(_spanWithError)

      await Promise.all([
        ReleaseService.upsertRelease(
          _issue.workspace.toString(),
          _issue.project.toString(),
          _issue.service.serviceName,
          _issue.service.release as string,
        ),
        AlertService.sendAlert(
          workspaceId,
          projectId,
          {
            issue: _issue,
            span: _spanWithError,
            sessionRecording: debugSession,
          },
        ),
        MetricsService.createSessionRecordingWithErrorRateMetric(
          _issue.toObject(),
          debugSession._id,
          endUser?.hash,
        ),
        MetricsService.createIssueRateMetric(
          _issue.toObject(),
          {
            endUserHash: endUser?.hash,
            debugSessionId: debugSession._id,
          },
        ),
        DebugSessionModel.addIssueById(
          _issue.workspace,
          _issue.project,
          debugSession._id,
          {
            issueHash: _issue.hash,
            issueTitleHash: _issue.titleHash,
            issueComponentHash: _issue.componentHash,
            issueCustomHash: _issue.customHash,
            spanId: _spanWithError.SpanId,
            traceId: _spanWithError.TraceId,
          },
        ),
      ])
    }

    if (!Object.keys(spanIssueMap).length) {
      // TODO: change log level to info
      logger.warn('[OTEL-ERROR-TRACE] No issues to create')
      return {
        spanIssueMap: {},
        debugSession,
      }
    }

    if (endUser) {
      await Promise.all(Object.values(spanIssueMap).map(issue => IssueEndUserModel.createIssueEndUser({
        workspace: workspaceId,
        project: projectId,
        issue: (issue as IIssueDocument)?.toObject?.() || (issue as IIssue),
        endUser,
      })))
    }

    if (insertSpans && debugSession) {
      spansWithError = OtlpLib.injectAttributeToSpans(
        spansWithError,
        [{
          name: ATTR_MULTIPLAYER_SESSION_ID,
          value: debugSession._id.toString(),
        }],
      )

      if (
        debugSession?.sessionType === SessionType.CONTINUOUS
      ) {
        await ContinuousDebugSessionService.createContinuousDebugSessionSpans(spansWithError)
      } else {
        await DebugSessionService.createDebugSessionSpans(spansWithError)
      }
    }

    await Promise.all(Object.values(spanIssueMap).map(async issue => {
      if (!issue._id) {
        const _issueFromDb = await IssueModel.findIssueByComponentHash(
          issue.componentHash,
        )

        if (!_issueFromDb) {
          logger.error({
            workspaceId: issue.workspace.toString(),
            projectId: issue.project.toString(),
            issueHash: issue.hash,
            issueComponentHash: issue.componentHash,
            issueTitleHash: issue.titleHash,
          }, '[OTEL-ERROR-TRACE] Issue not found after creation')
          return
        }

        issue = _issueFromDb
      }

      if (
        issue
        && !issue.resolved
        && !issue.archived
        && !issue.solution?.inProgress
        && !issue.solution?.gitBranch
        && !issue.solution?.fixWithAgentFailed
      ) {
        const shouldAutoResolveIssue = await AgentService.shouldAutoResolveIssue(
          issue.project.toString(),
          issue.integration?.toString(),
        )

        logger.debug({
          issueTitle: issue.title,
          shouldAutoResolveIssue,
        }, '[OTEL-ERROR-TRACE] Should auto resolve')

        if (shouldAutoResolveIssue) {
          const issueLockKey = `${REDIS_ISSUE_RESOLVE_LOCK_PREFIX}${issue.componentHash}`
          const issueLocked = await redis.lockKey(issueLockKey, REDIS_ISSUE_RESOLVE_LOCK_TTL)

          if (issueLocked) {
            const agent = await AgentService.findAgentWithAvailableSlot(
              issue.workspace.toString(),
              issue.project.toString(),
              issue,
            )

            if (agent) {
              await AgentService.notifyDebuggingAgentToFixIssue(
                agent,
                issue,
                AgentChatStartReasonEnum.OTLP_ERROR,
              )
            }
          }
        }
      }
    }))

    return {
      spanIssueMap,
      debugSession,
    }
  } catch (error) {
    logger.error(error, '[OTEL-ERROR-TRACE] Failed to process otel error trace from kafka')
    processingErrorSpansErrorRate.add(spansCount)

    return {
      spanIssueMap: {},
      debugSession: undefined,
    }
  } finally {
    const duration = Timer.getDuration(startTime)
    processingErrorSpansDuration.record(duration)
  }
}