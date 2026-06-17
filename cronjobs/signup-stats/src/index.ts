import 'dotenv/config'
import axios from 'axios'
import mongo from '@multiplayer/mongo'
import { UserModel } from '@multiplayer/models'
import { Parser } from '@json2csv/plainjs'
import logger from '@multiplayer/logger'
import {
  SLACK_API,
  SLACK_OAUTH_TOKEN,
  SLACK_CHANNEL,
  PERIOD_MS,
} from './config'

const main = async () => {
  let exitWithError = false

  try {
    await mongo.connect()

    const users = await UserModel.find({
      $and: [
        {
          primaryEmail: {
            $not: /.*@multiplayer.app$/,
          },
        },
        {
          primaryEmail: {
            $not: /.*@filingramp.com$/,
          },
        },
        {
          primaryEmail: {
            $exists: true,
          },
        },
        {
          $expr: {
            $gte: [
              '$createdAt',
              {
                '$subtract': [
                  '$$NOW',
                  PERIOD_MS,
                ],
              },
            ],
          },
        },
      ],
    })

    if (!users.length) {
      const { data } = await axios({
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${SLACK_OAUTH_TOKEN}`,
        },
        url: 'https://slack.com/api/chat.postMessage',
        data: {
          channel: SLACK_CHANNEL,
          text: 'No signups for today',
        },
      })

      if (!data.ok) {
        throw data
      }

    } else {
      const csvData = users.map((user: any, index) => ({
        '#': index + 1,
        email: user.primaryEmail,
        authType: user.primaryEmailSource,
        createdAt: user.createdAt,
      }))
      const json2csvParser = new Parser()
      const csvStr = json2csvParser.parse(csvData)

      const csvBuffer = Buffer.from(csvStr, 'utf8')

      const formBody = new URLSearchParams({
        filename: 'users.csv',
        length: String(csvBuffer.length),
      })
      const getUrlRes = await axios.post(
        `${SLACK_API}/files.getUploadURLExternal`,
        formBody.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            Authorization: `Bearer ${SLACK_OAUTH_TOKEN}`,
          },
        },
      )

      if (!getUrlRes.data?.ok) {
        throw getUrlRes.data
      }
      const {
        upload_url: uploadUrl,
        file_id: fileId,
      } = getUrlRes.data

      await axios.post(uploadUrl, csvBuffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Length': csvBuffer.length,
        },
      })

      const completeRes = await axios.post(
        `${SLACK_API}/files.completeUploadExternal`,
        {
          files: [{
            id: fileId,
            title: 'users.csv',
          }],
          channel_id: SLACK_CHANNEL,
          channels: SLACK_CHANNEL,
          initial_comment: 'Signed up users:',
        },
        {
          headers: {
            'Content-type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${SLACK_OAUTH_TOKEN}`,
          },
        },
      )

      if (!completeRes.data?.ok) {
        throw completeRes.data
      }
    }

    logger.info(`Published signup stats to ${SLACK_CHANNEL}`)
  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    await mongo.disconnect()
    process.exit(Number(exitWithError))
  }
}

main()
