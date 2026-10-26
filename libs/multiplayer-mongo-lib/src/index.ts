// import './patch/mongodb-client-encryption'
import Mongoose, { ConnectOptions } from 'mongoose'
import logger from '@multiplayer/logger'
import * as _Config from './config'
import * as _encryption from './encryption'
import { runtimeAdapters } from './runtime-adapters'

export const encryption = _encryption

export { runtimeAdapters }

const MONGODB_URI_MASKED = _Config.MONGODB_URI?.replace(/:\/\/(.*):(.*)@/, '://***:***@')

export const mongoose = Mongoose

export const ObjectId = Mongoose.Types.ObjectId

export type ObjectId = Mongoose.Types.ObjectId

// export { type Binary } from 'bson'

export const Schema = Mongoose.Schema

export const Model = Mongoose.Model

export const Config = _Config

Mongoose.set('debug', _Config.MONGO_DEBUG)

Mongoose.connection.on('connected', () => {
  logger.info(`[MONGO] Connected to ${MONGODB_URI_MASKED}, db: ${Mongoose.connection.name}`)
})

Mongoose.connection.on('error', error => {
  logger.error(error, `[MONGO] Connection to MongoDB failed: ${error.message}`)
})

Mongoose.connection.on('reconnected', () => {
  logger.info(`[MONGO] Reconnected to ${MONGODB_URI_MASKED}`)
})

Mongoose.connection.on('disconnected', () => {
  logger.info(`[MONGO] Disconnected from ${MONGODB_URI_MASKED}`)
})

Mongoose.connection.on('close', () => {
  logger.info(`[MONGO] Connection closed ${MONGODB_URI_MASKED}`)
})

Mongoose.connection.on('reconnectFailed', () => {
  logger.error(`[MONGO] Reconnect Failed ${MONGODB_URI_MASKED}`)
})

const connect = async () => {
  await encryption.connect()

  const encryptionKeyId = await encryption.getKeyId()

  const options: ConnectOptions = {
    dbName: _Config.MONGODB_DB_NAME,
    autoIndex: true,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 25000,
    minPoolSize: 3,
    runtimeAdapters,
    // Fields are encrypted explicitly via `encryption.encrypt()`; the driver only auto-decrypts on read.
    // schemaMap is ignored while bypassAutoEncryption is true - keep it in sync for enabling auto-encryption.
    autoEncryption: {
      bypassAutoEncryption: true,
      keyVaultNamespace: encryption.keyVaultNamespace,
      kmsProviders: encryption.kmsProviders,
      schemaMap: encryption.getEncryptionSchemaMap(encryptionKeyId),
      extraOptions: {
        mongocryptdURI: Config.MONGODB_URI,
      },
    },
  }
  await Mongoose.connect(_Config.MONGODB_URI, options)
}

export const connected = () => Mongoose.connection.readyState === 1

const disconnect = async () => {
  if (!connected()) return
  await Promise.allSettled([
    Mongoose.connection.close(),
    encryption.disconnect(),
  ])
}

export default {
  encryption,
  connect,
  disconnect,
  connected,
  mongoose,
  ObjectId: Mongoose.Types.ObjectId,
  Schema: Mongoose.Schema,
  Model: Mongoose.Model,
}
