import Mongo from '@multiplayer/mongo'

const wait = ms => new Promise(res => setTimeout(res, ms))

global.beforeAll(async () => {
  await Mongo.connect()
  await wait(1400)
})

global.afterAll(async () => {
  await Mongo.disconnect()
})
