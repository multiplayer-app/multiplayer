import { ObjectId } from '@multiplayer/mongo'
import {
  DebugSessionDataType,
} from '@multiplayer/types'

export const getS3ProjectDebugSessionFolder = ({
  workspaceId,
  projectId,
}: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
}): string => {
  return `workspaces/${workspaceId}/projects/${projectId}`
}

export const getS3DebugSessionFolder = ({
  workspaceId,
  projectId,
  debugSessionId,
}: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  debugSessionId: string | ObjectId,
}): string => {
  const debugSessionProjectFolder = getS3ProjectDebugSessionFolder({ workspaceId, projectId })
  return `${debugSessionProjectFolder}/debug-sessions/${debugSessionId}`
}

export const getS3Key = ({
  workspaceId,
  projectId,
  debugSessionId,
  dataType,
  fileId,
}: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  debugSessionId: string | ObjectId,
  fileId: string,
  dataType: DebugSessionDataType,
}): string => {
  const debugSessionS3Folder = getS3DebugSessionFolder({
    workspaceId,
    projectId,
    debugSessionId,
  })

  return `${debugSessionS3Folder}/${dataType}/${fileId}`
}
