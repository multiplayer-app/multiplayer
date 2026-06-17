import express from 'express'
import {
  health,
  healthz,
  radarDetections,
  debugSessions,
  debugSessionOtelLogs,
  debugSessionOtelTraces,
  debugSessionRrwebEvents,
  flows,
  stats,
  platforms,
  notes,
  conditionalRecordingFilters,
  globalConditionalRecordingSettings,
  issues,
  endUser,
  metrics,
  alertRules,
  globalIssuesSettings,
  alertHistory,
  agents,
  agentChats,
  agentChatAttachments,
} from './routes'

const { Router } = express
const router = Router()

router.use('/workspaces/:workspaceId/projects/:projectId/radar-detections', radarDetections)
router.use('/workspaces/:workspaceId/projects/:projectId/debug-sessions', debugSessions)
router.use('/workspaces/:workspaceId/projects/:projectId/debug-sessions/:debugSessionId/otel-logs', debugSessionOtelLogs)
router.use('/workspaces/:workspaceId/projects/:projectId/debug-sessions/:debugSessionId/otel-traces', debugSessionOtelTraces)
router.use('/workspaces/:workspaceId/projects/:projectId/debug-sessions/:debugSessionId/rrweb-events', debugSessionRrwebEvents)
router.use('/workspaces/:workspaceId/projects/:projectId/flows', flows)
router.use('/workspaces/:workspaceId/projects/:projectId/stats', stats)
router.use('/workspaces/:workspaceId/projects/:projectId/platforms', platforms)
router.use('/workspaces/:workspaceId/projects/:projectId/debug-sessions/:debugSessionId/notes', notes)
router.use('/workspaces/:workspaceId/projects/:projectId/remote-session-recording-conditions', conditionalRecordingFilters)
router.use('/workspaces/:workspaceId/projects/:projectId/remote-session-recording-settings', globalConditionalRecordingSettings)
router.use('/workspaces/:workspaceId/projects/:projectId/issues', issues)
router.use('/workspaces/:workspaceId/projects/:projectId/issues-settings', globalIssuesSettings)
router.use('/workspaces/:workspaceId/projects/:projectId/end-users', endUser)
router.use('/workspaces/:workspaceId/projects/:projectId/metrics', metrics)
router.use('/workspaces/:workspaceId/projects/:projectId/alert-history', alertHistory)
router.use('/workspaces/:workspaceId/projects/:projectId/alert-rules', alertRules)
router.use('/workspaces/:workspaceId/projects/:projectId/agents/files', agentChatAttachments)
router.use('/workspaces/:workspaceId/projects/:projectId/agents/chats', agentChats)
router.use('/workspaces/:workspaceId/projects/:projectId/agents', agents)
router.use('/health', health)
router.use('/healthz', healthz)

export default router
