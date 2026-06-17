import Mongo from '@multiplayer/mongo'
import * as Mock from './mock'

const wait = ms => new Promise(res => setTimeout(res, ms))

global.beforeAll(async () => {
  await Mongo.connect()
  await Mock.counter()
  await Mock.roles()

  await wait(1400)
})

global.afterAll(async () => {
  await Mongo.disconnect()
})
