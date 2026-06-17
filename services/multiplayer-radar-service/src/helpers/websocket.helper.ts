import { Socket } from 'socket.io'
import logger from '@multiplayer/logger'
import {
  SocketIOError,
  ErrorMessage,
} from '@multiplayer/types'

export const getSessionRecordingRoomInProject = (workspace: string, project: string) => {
  return `debug-session:workspace:${workspace}:${project}`
}

export const getSessionRecordingRoomById = (debugSessionId: string) => {
  return `debug-session:${debugSessionId}`
}

export const getSessionRecordingDataRoomById = (debugSessionId: string) => {
  return `debug-session:data:${debugSessionId}`
}

export const getEndUserRoomInProject = (workspace: string, project: string) => {
  return `end-user:workspace:${workspace}:${project}`
}

export const getEndUserSocketRoomInProject = (
  workspace: string,
  project: string,
  endUserId: string,
  socketId: string,
) => {
  return `end-user:workspace:${workspace}:${project}:${endUserId}:${socketId}`
}

export const getAgentRoomInProject = (
  workspace: string,
  project: string,
  agentId: string,
) => {
  return `agent:${workspace}:${project}:${agentId}`
}

/** Room that all subscribers of a specific chat session join. */
export const getChatRoom = (workspaceId: string, projectId: string, chatId: string) =>
  `/workspaces/${workspaceId}/projects/${projectId}/chats/${chatId}`

export const extractIdsFromNamespace = (socket: Socket, next) => {
  try {
    const namespace = socket.nsp.name

    const regex =
      /^\/workspaces\/([a-f0-9]{24})\/projects\/([a-f0-9]{24})/

    const match = namespace.match(regex)

    if (match) {
      const workspaceId = match[1]
      const projectId = match[2]

      socket.data.workspaceId = workspaceId
      socket.data.projectId = projectId
    }
    return next()
  } catch (err) {
    logger.error(err)
    return next(new SocketIOError(ErrorMessage.INTERNAL_ERROR, 500))
  }
}
