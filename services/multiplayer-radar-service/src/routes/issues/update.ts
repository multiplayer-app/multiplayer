import type { Request, Response, NextFunction } from 'express'
import { IssueModel, IIssueDocument } from '@multiplayer/models'
import { AlertRuleConditionType, IssueSeverityLevel } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { AlertService, IssueService } from '../../services'

// Issue state changes alert rules can subscribe to. "New" severity means the issue had no
// severity yet (first triage); "existing" means it was raised to HIGH from another level.
const getTransitionConditionTypes = (
  before: IIssueDocument,
  after: IIssueDocument,
): AlertRuleConditionType[] => {
  const conditionTypes: AlertRuleConditionType[] = []

  if (before.resolved && !after.resolved) {
    conditionTypes.push(AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED)
  }

  if (before.archived && !after.archived) {
    conditionTypes.push(AlertRuleConditionType.ISSUE_UNARCHIVED)
  }

  if (after.severity === IssueSeverityLevel.HIGH && before.severity !== IssueSeverityLevel.HIGH) {
    conditionTypes.push(before.severity === undefined || before.severity === null
      ? AlertRuleConditionType.NEW_ISSUE_SEVERITY_MARKED_AS_HIGH
      : AlertRuleConditionType.EXISTING_ISSUE_SEVERITY_MARKED_AS_HIGH)
  }

  return conditionTypes
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const issueId = req.params.issueId as string

    const payload = req.body

    const previousIssue = await IssueModel.findIssueByIdAndProjectAndWorkspace(
      issueId,
      projectId,
      workspaceId,
    )

    const issue = await IssueModel.updateIssueById(
      workspaceId,
      projectId,
      issueId,
      payload,
    )

    if (previousIssue && issue) {
      if (!previousIssue.resolved && issue.resolved) {
        IssueService.resetOccurrenceThrottle(workspaceId, projectId, issue.componentHash)
          .catch(err => logger.error(err, '[ISSUE] Failed to reset issue occurrence throttle'))
      }

      for (const conditionType of getTransitionConditionTypes(previousIssue, issue)) {
        AlertService.sendAlert(workspaceId, projectId, { issue, conditionType })
          .catch(err => logger.error(err, `[ALERT] Failed to send ${conditionType} alert`))
      }
    }

    return res.status(200).json(issue)
  } catch (err) {
    return next(err)
  }
}
