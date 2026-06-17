import { IIssue } from '@multiplayer/types'
import { FRONTEND_DOMAIN, FRONTEND_PROTOCOL } from '../../config'

export const buildIssueUrl = (issue: IIssue): string | undefined => {
  if (!issue?.titleHash || !issue?.componentHash) {
    return undefined
  }

  return `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}/project/${issue.workspace}/${issue.project}/default/issues/issue/${issue.titleHash}?componentHash=${issue.componentHash}`
}
