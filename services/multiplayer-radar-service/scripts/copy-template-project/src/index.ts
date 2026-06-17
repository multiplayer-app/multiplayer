import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import {
  EntityCommitModel,
  ProjectModel,
} from '@multiplayer/models'
// import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
// import { createRequest } from '@aws-sdk/util-create-request'
// import { formatUrl } from '@aws-sdk/util-format-url'
import { Upload } from '@aws-sdk/lib-storage'
import stream from 'stream'
// import {
//   CollaborationAMQPMessageType,
//   EntityType,
//   RadarDetectionSource,
// } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import {
  S3,
  GetObjectCommand,
  PutObjectCommand,
  CompleteMultipartUploadOutput,
  ObjectCannedACL, GetObjectOutput,
  GetObjectCommandOutput,
} from '@aws-sdk/client-s3'
// import AMQP from '@multiplayer/amqp'
// import * as Clickhouse from '@multiplayer/clickhouse'

export const AMQP_EVENT_QUEUE = process.env.AMQP_EVENT_QUEUE || 'event'
export const CLICKHOUSE_RADAR_DB = process.env.CLICKHOUSE_RADAR_DB || 'radar'
export const CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME = process.env.CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME || 'detections'

const PRODUCTION_BUCKET = 'multiplayer-production-s3-private'
const LOCAL_BUCKET = 'private-bucket'

const PROJECT_ID = '65109c67d4abb818be2e497d'

const prodS3Client = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    sessionToken: process.env.AWS_SESSION_TOKEN as string,
  },
  region: 'us-east-1',
})

const localS3Client = new S3({
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  region: 'us-east-1',
  endpoint: 'http://localhost:9000',
  forcePathStyle: true,
})


const streamUpload = (Key: string, Bucket: string, ACL?: ObjectCannedACL) => {
  const passThroughStream = new stream.PassThrough()

  const options: any = {
    client: localS3Client,
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

const downloadFile = (Key: string, Bucket: string): Promise<GetObjectOutput> => {
  const command = new GetObjectCommand({
    Bucket: PRODUCTION_BUCKET,
    Key,
  })

  return prodS3Client.send(command)
}

const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()



    const project = await ProjectModel.findOne({ _id: PROJECT_ID })

    if (!project) {
      throw new Error('Template project not found')
    }

    for await (const entityCommit of EntityCommitModel.find({ project: project._id }).cursor()) {
      if (!entityCommit.key || !entityCommit.bucket) {
        continue
      }

      const { Body } = await downloadFile(
        entityCommit.key as string,
        entityCommit.bucket as string,
      )

      const {
        writeStream,
        promise,
      } = streamUpload(
        entityCommit.key as string,
        LOCAL_BUCKET,
      )

      if (Body) {
        if (Body instanceof stream.Readable) {
          Body.pipe(writeStream)
        } else if (Body instanceof ReadableStream) {
          const reader = Body.getReader()
          const pump = () => reader.read().then(({ done, value }) => {
            if (done) {
              writeStream.end()
              return
            }
            writeStream.write(Buffer.from(value))
            pump()
          })
          pump()
        }
      }


      await promise
      // eslint-disable-next-line
      console.log(`Copied ${entityCommit._id}`)
    }


  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    await mongo.disconnect()

    process.exit(Number(exitWithError))
  }
}

main()
