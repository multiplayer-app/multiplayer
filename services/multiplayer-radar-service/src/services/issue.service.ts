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
import NodeCache from 'node-cache'
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
  AlertRuleConditionType,
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
  IssueOccurrenceThrottleCache,
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
const failedErrorSpansCounter = metrics.createCounter('failed_error_spans_total')
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

  await IssueOccurrenceThrottleCache.del(
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
        IssueOccurrenceThrottleCache.del(
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

  // A new occurrence of a resolved issue is a regression: reopen it. Archived means ignored,
  // so an archived issue keeps its state.
  const regressed = Boolean(existingIssue?.resolved && !existingIssue?.archived)

  if (existingIssue) {
    payload.archived = existingIssue.archived || false
    payload.resolved = existingIssue.archived ? existingIssue.resolved || false : false
    payload.solution = existingIssue.solution || undefined
    if (payload.fixabilityScore === undefined) {
      payload.fixabilityScore = existingIssue.fixabilityScore
    }
  }

  const issue = await IssueModel.createIssue(payload)

  return { issue, regressed }
}

// Throttled occurrences only record a metric. Once a minute per issue (and replica) they also
// refresh it: its `lastSeen`, its threshold alerts, and whether it was resolved meanwhile.
const THROTTLED_ISSUE_REFRESH_SECONDS = 60
const throttledIssueRefreshes = new NodeCache({ stdTTL: THROTTLED_ISSUE_REFRESH_SECONDS })

const shouldRefreshThrottledIssue = (issueHash: string): boolean => {
  if (throttledIssueRefreshes.get(issueHash)) {
    return false
  }

  throttledIssueRefreshes.set(issueHash, true)
  return true
}

/**
 * Refreshes a known issue from one of its throttled occurrences.
 * @returns the stored issue when it turned out to be resolved: the occurrence is a regression
 * and must take the full path
 */
const refreshThrottledIssue = async (
  workspaceId: string,
  projectId: string,
  issue: IIssue,
  span: OtelSpanCh,
): Promise<boolean> => {
  const storedIssue = await IssueModel.findOneAndUpdate(
    { workspace: workspaceId, project: projectId, hash: issue.hash } as any,
    { $set: { lastSeen: new Date() } },
    { returnDocument: 'after' as const },
  )

  if (!storedIssue || storedIssue.archived) {
    return false
  }

  // Resolved without the throttle being reset (or reset on another replica): a regression
  if (storedIssue.resolved) {
    await IssueOccurrenceThrottleCache.del(workspaceId, projectId, issue.hash)
    return true
  }

  await AlertService.sendAlert(workspaceId, projectId, { issue: storedIssue, span })
  return false
}

// Occurrences of an issue are throttled for hours; clear that when it gets resolved so the
// next occurrence takes the full path and is caught as a regression right away.
export const resetOccurrenceThrottle = async (
  workspaceId: string,
  projectId: string,
  componentHash: string,
) => {
  const issues = await IssueModel.find(
    { workspace: workspaceId, project: projectId, componentHash },
    { hash: 1 },
  ).lean()

  await Promise.all(issues.map(({ hash }) => IssueOccurrenceThrottleCache.del(
    workspaceId,
    projectId,
    hash,
  )))
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

// What the error spans of a trace request share: where they belong, the session and end user they
// are recorded with - the first new issue creates the session when the trace has none - and the
// results
interface TraceIssueState {
  workspaceId: string
  projectId: string
  integrationId: string
  clientId?: string
  debugSession?: IDebugSession
  endUser?: IEndUser
  spanIssueMap: Record<string, IIssueDocument | IIssue>
  spansWithError: OtelSpanCh[]
}

// A throttled occurrence is only counted: its rate metric and end user relation. The full path
// creates both for the others.
const recordThrottledOccurrence = async (state: TraceIssueState, issue: IIssue) => {
  const { workspaceId, projectId, endUser } = state

  await Promise.all([
    MetricsService.createIssueRateMetric(issue, { endUserHash: endUser?.hash }),
    ...endUser
      ? [IssueEndUserModel.createIssueEndUser({ workspace: workspaceId, project: projectId, issue, endUser })]
      : [],
  ])
}

// The session of an error outside any recording, which the trace's other errors join
const createSessionForIssue = async (
  state: TraceIssueState,
  issue: IIssueDocument,
  span: OtelSpanCh,
): Promise<IDebugSession> => {
  const { debugSession, endUser } = await DebugSessionService.createDebugSessionForIssue(
    issue.toObject(),
    span,
    state.clientId,
  )

  state.debugSession = debugSession
  state.endUser = endUser

  if (endUser) {
    await MetricsService.createSessionRecordingRateMetric(
      state.workspaceId,
      state.projectId,
      debugSession._id,
      endUser.hash,
    )
  }

  return debugSession
}

const processErrorSpan = async (state: TraceIssueState, span: OtelSpanCh): Promise<void> => {
  const { workspaceId, projectId, integrationId } = state
  const spanIssue = OtlpLib.getIssueFromSpan(span)

  if (!spanIssue) {
    return
  }

  const issueLog = {
    traceId: span.TraceId,
    spanId: span.SpanId,
    category: spanIssue.category,
    issueHash: spanIssue.hash,
    issueComponentHash: spanIssue.componentHash,
    issueTitleHash: spanIssue.titleHash,
  }

  if (!await IssueSettingsLib.shouldCreateIssue(spanIssue, integrationId)) {
    logger.debug(issueLog, '[OTEL-ERROR-TRACE] Issue category not in create only for categories')
    return
  }

  const claimed = await OtelSpanIdCache.claim(
    workspaceId,
    projectId,
    span.TraceId as string,
    span.SpanId as string,
  )

  if (!claimed) {
    state.spanIssueMap[span.SpanId] = spanIssue
    return
  }

  const throttled = await IssueOccurrenceThrottleCache.get(workspaceId, projectId, spanIssue.hash)

  logger.debug({ ...issueLog, throttled }, '[OTEL-ERROR-TRACE] Issue throttling info')

  // Outside a recording, occurrences of a known issue are throttled - unless it was resolved
  // meanwhile: that occurrence is a regression and takes the full path
  if (!state.debugSession && throttled) {
    const isRegression = shouldRefreshThrottledIssue(spanIssue.hash)
      && await refreshThrottledIssue(workspaceId, projectId, spanIssue, span)

    if (!isRegression) {
      await recordThrottledOccurrence(state, spanIssue)
      return
    }
  }

  spanIssue.integration = integrationId
  const { issue, regressed } = await createIssue(spanIssue)
  state.spanIssueMap[span.SpanId] = issue

  await IssueOccurrenceThrottleCache.set(workspaceId, projectId, issue.hash)

  const debugSession = state.debugSession || await createSessionForIssue(state, issue, span)
  const { endUser } = state

  if (issue.resolved || issue.archived) {
    await MetricsService.createIssueRateMetric(
      issue.toObject(),
      {
        endUserHash: endUser?.hash,
        debugSessionId: debugSession._id,
      },
    )
    return
  }

  span.SpanAttributes[ATTR_MULTIPLAYER_SESSION_ID] = debugSession._id
  span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_HASH] = issue.hash
  span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH] = issue.componentHash
  span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_TITLE_HASH] = issue.titleHash

  state.spansWithError.push(span)

  await Promise.all([
    ReleaseService.upsertRelease(
      issue.workspace.toString(),
      issue.project.toString(),
      issue.service.serviceName,
      issue.service.release as string,
    ),
    AlertService.sendAlert(
      workspaceId,
      projectId,
      {
        issue,
        span,
        sessionRecording: debugSession,
      },
    ),
    ...regressed
      ? [AlertService.sendAlert(
        workspaceId,
        projectId,
        {
          issue,
          span,
          sessionRecording: debugSession,
          conditionType: AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED,
        },
      )]
      : [],
    MetricsService.createSessionRecordingWithErrorRateMetric(
      issue.toObject(),
      debugSession._id,
      endUser?.hash,
    ),
    MetricsService.createIssueRateMetric(
      issue.toObject(),
      {
        endUserHash: endUser?.hash,
        debugSessionId: debugSession._id,
      },
    ),
    DebugSessionModel.addIssueById(
      issue.workspace,
      issue.project,
      debugSession._id,
      {
        issueHash: issue.hash,
        issueTitleHash: issue.titleHash,
        issueComponentHash: issue.componentHash,
        issueCustomHash: issue.customHash,
        spanId: span.SpanId,
        traceId: span.TraceId,
      },
    ),
  ])
}

// Hands an open issue to a debugging agent, when the project fixes issues automatically
const requestAgentFix = async (spanIssue: IIssueDocument | IIssue) => {
  let issue = spanIssue

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
    issue.resolved
    || issue.archived
    || issue.solution?.inProgress
    || issue.solution?.gitBranch
    || issue.solution?.fixWithAgentFailed
  ) {
    return
  }

  const shouldAutoResolveIssue = await AgentService.shouldAutoResolveIssue(
    issue.project.toString(),
    issue.integration?.toString(),
  )

  logger.debug({
    issueTitle: issue.title,
    shouldAutoResolveIssue,
  }, '[OTEL-ERROR-TRACE] Should auto resolve')

  if (!shouldAutoResolveIssue) {
    return
  }

  const issueLockKey = `${REDIS_ISSUE_RESOLVE_LOCK_PREFIX}${issue.componentHash}`
  const issueLocked = await redis.lockKey(issueLockKey, REDIS_ISSUE_RESOLVE_LOCK_TTL)

  if (!issueLocked) {
    return
  }

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

    // Errors outside any recorded session (API clients, webhooks, consumers, jobs) are issues
    // too: they carry a plain trace id and get a debug session auto-created below.
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

    const state: TraceIssueState = {
      workspaceId,
      projectId,
      integrationId,
      debugSession: await DebugSessionService.getDebugSessionFromTraceId(
        workspaceId,
        projectId,
        traceId,
      ),
      spanIssueMap: {},
      spansWithError: [],
    }

    if (
      traceId.startsWith(MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX)
      || traceId.startsWith(MULTIPLAYER_TRACE_SESSION_PREFIX)
    ) {
      state.clientId = traceId.substring(
        MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX.length,
        MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX.length +
        MULTIPLAYER_TRACE_CLIENT_ID_LENGTH * 2,
      )
      state.endUser = await EndUserService.findEndUserByClientId(state.clientId)
    }

    for (const span of spans) {
      // One span failing (a database hiccup, a bad payload) must not drop the others
      try {
        await processErrorSpan(state, span)
      } catch (error) {
        failedErrorSpansCounter.add(1)
        logger.error({
          err: error,
          traceId: span.TraceId,
          spanId: span.SpanId,
        }, '[OTEL-ERROR-TRACE] Failed to process error span')
      }
    }

    const { spanIssueMap, debugSession, endUser } = state

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
      const spansWithError = OtlpLib.injectAttributeToSpans(
        state.spansWithError,
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

    await Promise.all(Object.values(spanIssueMap).map(requestAgentFix))

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