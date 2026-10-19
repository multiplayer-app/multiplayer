import { ConnectionString } from 'mongodb-connection-string-url'

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/multiplayer'
export const MONGO_DEBUG = (process.env.MONGO_DEBUG || 'false') === 'true'

export const MONGODB_DEFAULT_DB_NAME = 'multiplayer'

// Precedence: MONGODB_DB_NAME -> database in MONGODB_URI -> default
export const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME
  || decodeURIComponent(new ConnectionString(MONGODB_URI).pathname.slice(1))
  || MONGODB_DEFAULT_DB_NAME
export const MONGODB_ENCRYPTION_KEY_VAULT_DB_NAME = process.env.MONGODB_ENCRYPTION_KEY_VAULT_DB_NAME || 'encryption'
export const MONGODB_ENCRYPTION_KEY_VAULT_COLLECTION_NAME = process.env.MONGODB_ENCRYPTION_KEY_VAULT_COLLECTION_NAME || '__keyVault'
export const MONGODB_ENCRYPTION_DEK_NAME = process.env.MONGODB_ENCRYPTION_DEK_NAME || 'data-key'
export const MONGODB_ENCRYPTION_MASTER_KEY_PROVIDER = process.env.MONGODB_ENCRYPTION_MASTER_KEY_PROVIDER || 'local'

export const AWS_KMS_KEY_ARN = process.env.AWS_KMS_KEY_ARN
export const AWS_REGION = process.env.AWS_REGION
