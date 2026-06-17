import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import logger from '@multiplayer/logger'
import { CounterModel } from '@multiplayer/models'

const main = async () => {
  await mongo.connect()

  const countersData = [
    {
      _id: 'User-Counter',
      seq: 10000,
    },
  ]

  const counters = await CounterModel.insertMany(countersData)

  logger.info(counters, 'counter')

  await mongo.disconnect()
}

main()
