import {
  DebugSessionDataType,
  IDebugSessionRrwebEvent,
} from '@multiplayer/types'
import { s3 } from '@multiplayer/s3'
import { unpack } from '@rrweb/packer'
import { eventWithTime } from '@rrweb/types'
import logger from '@multiplayer/logger'
import { MULTIPLAYER_BASE_API_URL } from '../../config'

const getRrwebEventsFromRadar = async (
  debugSessionId: string,
  workspace: string,
  project: string,
  headers: Record<string, string>,
): Promise<IDebugSessionRrwebEvent[] | undefined> => {
  try {
    const url = `${MULTIPLAYER_BASE_API_URL}/v0/radar/workspaces/${workspace}/projects/${project}/debug-sessions/${debugSessionId}/rrweb-events`
    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    logger.error('Error fetching rrweb events from radar service:', error)
    return undefined
  }
}

export const loadRrwebEvents = async (params: {
  debugSession: {
    workspace: { toString(): string };
    project: { toString(): string };
    s3Files?: Array<{ dataType?: string; key?: string; bucket?: string }>;
  };
  debugSessionId: string;
  headers: Record<string, string>;
}): Promise<eventWithTime[]> => {
  const { debugSession, debugSessionId, headers } = params
  const rrwebFiles = (debugSession?.s3Files || []).filter(
    ({ dataType }) => dataType === DebugSessionDataType.RRWEB_EVENTS,
  )

  if (rrwebFiles.length > 0) {
    const rrwebEvents = await Promise.all(
      rrwebFiles.map(({ key, bucket }) =>
        s3.downloadFileAsString(key!, bucket!),
      ),
    )

    return rrwebEvents.reduce((acc, value) => {
      if (!value) {
        return acc
      }
      try {
        const events: any[] = JSON.parse(value)
        acc.push(...events.map((event) => unpack(event.data)))
      } catch (err) {
        logger.error(err)
      }
      return acc
    }, [] as eventWithTime[])
  }

  const radarEvents = await getRrwebEventsFromRadar(
    debugSessionId,
    debugSession.workspace.toString(),
    debugSession.project.toString(),
    headers,
  )

  if (!radarEvents) {
    return []
  }

  return radarEvents.map((event) => unpack(event.data))
}
