# Mongo lib

## Environment variables:

| Variable name                                   | Description                              | Required | Default                                       |
|-------------------------------------------------|------------------------------------------|----------|-----------------------------------------------|
| `MONGODB_URI`                                   | Connection URI                           |   ✘      | `mongodb://localhost:27017/multiplayer`       |
| `MONGO_DEBUG`                                   | Enable mongoose debug mode               |   ✘      | `false`                                       |
| `MONGODB_ENCRYPTION_KEY_VAULT_DB_NAME`          | Db name for encryption keys              |   ✘      | `encryption`                                  |
| `MONGODB_ENCRYPTION_KEY_VAULT_COLLECTION_NAME`  | Collection name for encryption keys      |   ✘      | `__keyVault`                                  |
| `MONGODB_ENCRYPTION_DEK_NAME`                   | Data Encryption Key name                 |   ✘      | `data-key`                                    |
| `MONGODB_ENCRYPTION_MASTER_KEY_PROVIDER`        | Encryption key provider `local` or `aws` |   ✘      | `local`                                       |
| `AWS_KMS_KEY_ARN`                               | AWS KMS key name                         |   ✘      |                                               |
| `AWS_REGION`                                    | AWS region                               |   ✘      |                                               |
| `AWS_ACCESS_KEY_ID`                             | AWS access key id                        |   ✘      |                                               |
| `AWS_SECRET_ACCESS_KEY`                         | AWS secret key id                        |   ✘      |                                               |
| `AWS_SESSION_TOKEN`                             | AWS session token                        |   ✘      |                                               |
