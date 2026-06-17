import { MongoClient, ClientEncryption } from 'mongodb'
import logger from '@multiplayer/logger'
import {
  MONGODB_DB_NAME,
  MONGODB_URI,
  MONGODB_ENCRYPTION_KEY_VAULT_DB_NAME,
  MONGODB_ENCRYPTION_KEY_VAULT_COLLECTION_NAME,
  MONGODB_ENCRYPTION_DEK_NAME,
  MONGODB_ENCRYPTION_MASTER_KEY_PROVIDER,
  AWS_KMS_KEY_ARN,
  AWS_REGION,
} from './config'

let dataKeyId

const MONGODB_URI_MASKED = MONGODB_URI?.replace(/:\/\/(.*):(.*)@/, '://***:***@')

const encryptionAlgorythm = 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'

export const encrypt = (data) => clientEncryption.encrypt(
  data,
  {
    algorithm: encryptionAlgorythm,
    keyId: dataKeyId,
  },
)

export const decrypt = (data) => clientEncryption.decrypt(data)

export const kmsProviders: any = {}
let keyProvider
let masterKey

if (MONGODB_ENCRYPTION_MASTER_KEY_PROVIDER === 'local') {
  keyProvider = 'local'
  const arr: number[] = []
  for (let i = 0; i < 96; ++i) {
    arr.push(i)
  }
  const key = Buffer.from(arr)

  kmsProviders.local = { key }
} else {
  kmsProviders.aws = {}
  keyProvider = 'aws'

  masterKey = {
    key: AWS_KMS_KEY_ARN,
    region: AWS_REGION,
  }
}

export const keyVaultNamespace = `${MONGODB_ENCRYPTION_KEY_VAULT_DB_NAME}.${MONGODB_ENCRYPTION_KEY_VAULT_COLLECTION_NAME}`

let unencryptedClient: MongoClient

let clientEncryption: ClientEncryption

export const connect = async () => {
  if (!unencryptedClient) {
    unencryptedClient = await new MongoClient(MONGODB_URI).connect()

    unencryptedClient.on('connectionReady', () => {
      logger.info(`[MONGO] Unencrypted Client Connected to ${MONGODB_URI_MASKED}`)
    })

    unencryptedClient.on('connectionClosed', () => {
      logger.info(`[MONGO] Unencrypted Client disconnected from ${MONGODB_URI_MASKED}`)
    })

    clientEncryption = new ClientEncryption(
      unencryptedClient,
      {
        kmsProviders,
        keyVaultNamespace,
      },
    )
  }

  return true
}

export const disconnect = async () => {
  if (unencryptedClient) {
    await unencryptedClient.close()
  }
}

export const getKeyId = async () => {
  logger.info(`[MONGO] Using key provider: ${keyProvider}`)

  dataKeyId = await unencryptedClient
    .db(MONGODB_ENCRYPTION_KEY_VAULT_DB_NAME)
    .collection(MONGODB_ENCRYPTION_KEY_VAULT_COLLECTION_NAME)
    .findOne({
      keyAltNames: MONGODB_ENCRYPTION_DEK_NAME,
      'masterKey.provider': keyProvider,
    })

  if (dataKeyId === null) {
    logger.info('[MONGO] Creating new DEK')

    dataKeyId = await clientEncryption
      .createDataKey(
        keyProvider,
        {
          keyAltNames: [MONGODB_ENCRYPTION_DEK_NAME],
          masterKey,
        },
      )
  } else {
    logger.info('[MONGO] Found existing DEK')
    dataKeyId = dataKeyId._id
  }

  return dataKeyId
}

export const getEncryptionSchemaMap = (encryptionKeyId) => {
  const schemaMap = {
    [`${MONGODB_DB_NAME}.integrations`]: {
      bsonType: 'object',
      properties: {
        metadata: {
          bsonType: 'object',
          properties: {
            accessToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
            refreshToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
            apiKey: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },


        gitlab: {
          bsonType: 'object',
          properties: {
            accessToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
            refreshToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },


        github: {
          bsonType: 'object',
          properties: {
            accessToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },

        bitbucket: {
          bsonType: 'object',
          properties: {
            accessToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
            refreshToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },

        atlassian: {
          bsonType: 'object',
          properties: {
            accessToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
            refreshToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },

        linear: {
          bsonType: 'object',
          properties: {
            accessToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },

        apiKey: {
          bsonType: 'object',
          properties: {
            apiKey: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },

        otel: {
          bsonType: 'object',
          properties: {
            apiKey: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },

        shareApiKey: {
          bsonType: 'object',
          properties: {
            apiKey: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },

        slack: {
          bsonType: 'object',
          properties: {
            accessToken: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },
      },
    },
    [`${MONGODB_DB_NAME}.workspace-users`]: {
      bsonType: 'object',
      properties: {
        googleWorkspaceToken: {
          bsonType: 'object',
          properties: {
            access_token: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
            refresh_token: {
              encrypt: {
                bsonType: 'string',
                keyId: [encryptionKeyId],
                algorithm: encryptionAlgorythm,
              },
            },
          },
        },
      },
    },
  }

  return schemaMap
}
