import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import { TokenModel } from '@multiplayer/models'
import { TokenTypeEnum } from '@multiplayer/types'
import logger from '@multiplayer/logger'

const main = async () => {
  await mongo.connect()

  const [,code] = process.argv[process.argv.length - 1].split('=')

  const inviteToken = await TokenModel.createToken(
    TokenTypeEnum.USER_INVITE,
    undefined,
    {
      token: code,
    },
  )

  logger.info(inviteToken.toObject(), 'Created user invitation token')

  await mongo.disconnect()
}

main()
