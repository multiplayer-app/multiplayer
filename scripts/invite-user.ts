import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import AMQP from '@multiplayer/amqp'
import { UserModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'

// MONGODB_URI=mongodb://localhost:27017/multiplayer AMQP_URI=amqp://localhost:5672  tsc invite-user.ts -- --emails=user3@gmail.com,user4@gmail.com | bunyan

const AMQP_NOTIFICATION_QUEUE = 'notification'

const main = async () => {
  await mongo.connect()
  await AMQP.connect()

  const [,userEmails] = process.argv[process.argv.length - 1].split('=')

  const emails = userEmails.split(',')

  const users = await Promise.all(emails.map(email =>
    UserModel.createWithoutProfile(email),
  ))

  logger.info(`Invited users: ${users.map(({ primaryEmail }) => primaryEmail).join(',')}`)

  await Promise.all(users.map(user =>
    AMQP.publish(
      AMQP_NOTIFICATION_QUEUE,
      {
        variables: {
          template: 'WELCOME',
          email: user.primaryEmail,
          data: {
            user: user,
          },
        },
      },
    ),
  ))

  await mongo.disconnect()
  await AMQP.disconnect()
  process.exit(0)
}

main()
