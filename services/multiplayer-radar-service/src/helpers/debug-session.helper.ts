import { ObjectId } from '@multiplayer/mongo'
import {
  DebugSessionDataType,
} from '@multiplayer/types'
import { s3 as S3Lib } from '@multiplayer/s3'
import { Store } from '../store'

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

// A DuckDB COPY of zero matching rows completes without error but writes no S3 object
// at all (verified against the real engine: a presigned GET for the key 404s with
// NoSuchKey afterwards). Rather than skip recording the file, write the empty result
// directly so the key genuinely exists and reads back as an empty array, matching
// what a client would expect from "this data type had no records".
export const moveTableToS3 = async (
  table: string,
  filter: any,
  totalCount: number,
  s3Host: string,
  bucket: string,
  key: string,
  awsAccessKeyId?: string,
  awsSecretAccessKey?: string,
  replace?: object,
): Promise<void> => {
  if (totalCount > 0) {
    await Store.moveDataToS3(
      `${s3Host}/${key}`,
      table,
      filter,
      awsAccessKeyId,
      awsSecretAccessKey,
      replace,
    )

    return
  }

  await S3Lib.uploadFile(key, bucket, '[]')
}
