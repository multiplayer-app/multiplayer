import redis from '@multiplayer/redis'
import {
  REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_PREFIX,
  REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_TTL,
} from '../config'
import {
  IConditionalRecordingFilters,
  IProject,
} from '@multiplayer/types'

const getKey = (projectId: string) => `${REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_PREFIX}:${projectId}`

export const get = async (
  projectId: string,
): Promise<{
  global: IProject['settings']['conditionalRecording'],
  filters: IConditionalRecordingFilters[]
} | undefined> => {
  const conditionalRecordingSettings = await redis.get(getKey(projectId))

  return conditionalRecordingSettings
}

export const set = async (
  projectId: string,
  payload: {
    global: IProject['settings']['conditionalRecording'],
    filters: IConditionalRecordingFilters[]
  },
): Promise<void> => {
  await redis.set(
    getKey(projectId),
    payload,
    REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_TTL,
  )
}

export const del = async (
  projectId: string,
): Promise<void> => {
  await redis.del(getKey(projectId))
}
