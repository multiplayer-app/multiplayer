import {
  S3,
  GetObjectCommand,
  PutObjectCommand,
  CompleteMultipartUploadOutput,
  ObjectCannedACL, GetObjectOutput,
  GetObjectCommandOutput, ListObjectsV2CommandOutput,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import { createRequest } from '@aws-sdk/util-create-request'
import { formatUrl } from '@aws-sdk/util-format-url'
import { Upload } from '@aws-sdk/lib-storage'
import stream from 'stream'
import {
  S3_HOST,
  S3_PRESIGNED_URL_EXPIRES,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} from './config'
import logger from '@multiplayer/logger'

const S3Client = new S3({
  ...S3_HOST ? {
    endpoint: S3_HOST,
    forcePathStyle: true,
  } : {},
  ...AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  } : {},
})

const signer = new S3RequestPresigner({
  ...S3Client.config,
})

export const uploadFile = (Key: string, Bucket: string, Body: any, Expires?: Date) => {
  return S3Client.putObject({
    Key,
    Bucket,
    Body,
    Expires,
  })
}

export const downloadFile = (Key: string, Bucket: string): Promise<GetObjectOutput> => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  })

  return S3Client.send(command)
}

export const downloadFileAsString = async (
  Key: string,
  Bucket: string,
): Promise<string | undefined> => {
  try {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    })

    const response = await S3Client.send(command)
    return response.Body?.transformToString()
  } catch (err) {
    if ((err as any)?.name === 'NoSuchKey') {
      return undefined
    }
    throw err
  }
}

export const downloadFileAsByteArray = async (Key: string, Bucket: string): Promise<Uint8Array | undefined> => {
  try {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    })

    const response = await S3Client.send(command)
    return response.Body?.transformToByteArray()
  } catch (err) {
    if ((err as any)?.name === 'NoSuchKey') {
      return undefined
    }
    throw err
  }
}

export const streamUpload = (
  Key: string,
  Bucket: string,
  ACL?: ObjectCannedACL,
) => {
  const passThroughStream = new stream.PassThrough()

  const options: any = {
    client: S3Client,
    params: {
      Bucket,
      Key,
      Body: passThroughStream,
    },
    leavePartsOnError: false,
  }

  if (ACL) {
    options.params.ACL = ACL
  }

  const upload = new Upload(options)

  return {
    writeStream: passThroughStream,
    promise: upload.done() as Promise<CompleteMultipartUploadOutput>,
  }
}

export const getPresignedUploadUrl = async (
  Key: string,
  Bucket: string,
  expiresIn?: number,
) => {
  const request = await createRequest(
    S3Client,
    new PutObjectCommand({ Key, Bucket }),
  )

  const signedUrl = formatUrl(await signer.presign(
    request,
    {
      expiresIn: expiresIn || S3_PRESIGNED_URL_EXPIRES,
    },
  ))

  return signedUrl
}

export const getPresignedDownloadUrl = async (Key: string, Bucket: string, expiresIn?: number) => {
  const request = await createRequest(
    S3Client,
    new GetObjectCommand({ Key, Bucket }),
  )

  const signedUrl = formatUrl(
    await signer.presign(
      request,
      {
        expiresIn: expiresIn ?? S3_PRESIGNED_URL_EXPIRES,
      },
    ),
  )

  return signedUrl
}

export const getDownloadUrl = (Key: string, Bucket: string) => {
  if (S3_HOST) {
    return `${S3_HOST}/${Bucket}/${Key}`
  }

  const regionString = AWS_REGION.includes('us-east-1') ? '' : '-' + AWS_REGION
  return `https://${Bucket}.s3${regionString}.amazonaws.com/${Key}`
}

export const copy = (
  Bucket: string,
  KeyFrom: string,
  KeyTo: string,
) => {
  return S3Client.copyObject({
    CopySource: `/${Bucket}/${KeyFrom}`,
    Bucket,
    Key: KeyTo,
  })
}

export const copyBetweenBuckets = (
  BucketFrom: string,
  KeyFrom: string,
  BucketTo: string,
  KeyTo: string,
) => {
  return S3Client.copyObject({
    CopySource: `/${BucketFrom}/${KeyFrom}`,
    Bucket: BucketTo,
    Key: KeyTo,
  })
}

export const getObject = async (
  Bucket: string,
  Key: string,
): Promise<GetObjectCommandOutput> => {
  return S3Client.getObject({
    Bucket,
    Key,
  })
}

export const listObjectsByPrefix = async (
  Bucket: string,
  Prefix: string,
): Promise<ListObjectsV2CommandOutput> => {
  return S3Client.send(
    new ListObjectsV2Command({
      Bucket,
      Prefix,
    }),
  )
}

export const headObject = async (
  Bucket: string,
  Key: string,
): Promise<GetObjectCommandOutput> => {
  return S3Client.headObject({
    Bucket,
    Key,
  })
}

export const deleteObject = async (
  Bucket: string,
  Key: string,
): Promise<GetObjectCommandOutput> => {
  return S3Client.deleteObject({
    Bucket,
    Key,
  })
}

export const deleteObjectsByPrefix = async (
  Bucket: string,
  Prefix: string,
  ContinuationToken?: string,
): Promise<void> => {
  const objects = await S3Client.listObjectsV2({ Bucket, Prefix, ContinuationToken })
  if (!objects.Contents?.length) return

  const deleteParams = {
    Bucket,
    Delete: { Objects: [] as { Key: string }[] },
  }

  objects.Contents.forEach(({ Key }) => {
    if (!Key) return
    deleteParams.Delete.Objects.push({ Key })
  })
  logger.info(deleteParams, '[S3] Deleting objects')
  const deletedResp = await S3Client.deleteObjects(deleteParams)
  if (deletedResp.Errors?.length) {
    logger.error(deletedResp.Errors, '[S3] Error during deleteObjectsByPrefix')
  }
  if (objects.IsTruncated) {
    await deleteObjectsByPrefix(Bucket, Prefix, objects.NextContinuationToken)
  }
}
