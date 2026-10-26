import { IIssue } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import {
  ProjectService,
  IntegrationService,
} from '../services'

export const shouldCreateIssue = async (
  issue: IIssue,
  integrationId: string,
): Promise<boolean> => {
  const integration = await IntegrationService.getIntegrationById(integrationId)

  const autoCreateIssues = !!integration?.otel?.autoCreateIssues

  if (!autoCreateIssues) {
    return false
  }

  const project = await ProjectService.getProject(issue.project)

  const issuesSettings = project.settings.issue

  // No categories selected means no restriction
  const categories = issuesSettings?.createOnlyForCategories || []
  const shouldCreate = !categories.length || categories.includes(issue.category)

  logger.debug(
    {
      category: issue.category,
      createOnlyForCategories: issuesSettings.createOnlyForCategories,
      shouldCreate,
    },
    '[ISSUE_SETTINGS_LIB] Should issue be created with category',
  )

  return shouldCreate
}
