import { IProject } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'
import { ProjectModel, ConditionalRecordingFiltersModel } from '@multiplayer/models'
import { ConditionalSessionRecordingSettingsCache } from '../cache'

export const getConditionalRecordingSettings = async (projectId: string) => {
  const settings = await ConditionalSessionRecordingSettingsCache.get(projectId)

  if (settings) {
    return settings
  }

  const project = await ProjectModel.findProjectById(projectId)

  if (!project) {
    throw new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND)
  }

  const projectObject = project.toObject()

  const globalSettings = projectObject.settings?.conditionalRecording || {}

  const { data: filters } = await ConditionalRecordingFiltersModel.findConditionalRecordingFilters({
    workspace: projectObject.workspace,
    project: projectObject._id,
    enabled: true,
  })

  const conditionalRecordingSettings = {
    global: globalSettings,
    filters: filters.map(filter => filter.toObject()),
  }

  await ConditionalSessionRecordingSettingsCache.set(
    projectId,
    conditionalRecordingSettings,
  )

  return conditionalRecordingSettings
}

export const invalidateConditionalRecordingSettings = async (projectId: string) => {
  await ConditionalSessionRecordingSettingsCache.del(projectId)
}
