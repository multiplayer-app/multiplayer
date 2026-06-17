# Multiplayer API service

## Variables

| Variable name                    | Description                                     | Required | Default                                       |
|----------------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `PORT`                           | App listen http port. Ex.: `3000`               |   ✘      | 3000                                          |
| `CORS_DOMAIN`                    | CORS                                            |   ✘      | `*`                                           |
| `API_PREFIX`                     | App http uri prefix. Ex.: `/v1`                  |   ✘      | /v0/api                                       |
| `SWAGGER_ENABLED`                | Enable Swagger                                  |   ✘      | `false`                                       |
| `S3_HOST`                        | S3 endpoint                                     |   ✘      | `https://s3.amazonaws.com`                    |
| `S3_PRESIGNED_URL_EXPIRES`       | S3 presigned url expiration time                |   ✘      | 120                                           |
| `S3_PUBLIC_BUCKET`               | S3 bucket for public files                       |   ✘      | `public-bucket`                               |
| `S3_PRIVATE_BUCKET`              | S3 bucket for private files                      |   ✘      | `private-bucket`                              |
| `AMQP_NOTIFICATION_QUEUE`        | Amqp notification queue                          |   ✘      | `notification`                                 |
| `AMQP_FORK_QUEUE`                |                                                 |   ✘      | `fork`                                        |
| `AMQP_CLEANUP_QUEUE`             |                                                 |   ✘      | `cleanup`                                     |
| `MARKETING_EMAIL`                | Email to send emails from contact form          |   ✘      | `hello@multiplayer.app`                       |
| `SUPPORT_EMAIL`                  | Email to send user feedback                     |   ✘      | `support@multiplayer.app`                     |
| `GOOGLE_CLIENT_ID`               |                                                 |   +      |                                               |
| `GOOGLE_CLIENT_SECRET`           |                                                 |   +      |                                               |
| `FRONTEND_DOMAIN`                |                                                 |   ✘      | `localhost`                                   |
| `FRONTEND_PROTOCOL`              |                                                 |   ✘      | `https`                                       |
| `OPENAI_API_KEY`                 | OpenAI api key                                  |   ✘      | `sample_api_key`                              |
| `OPENAI_ORG_ID`                  | OpenAI org id                                   |   ✘      | `sample_org_id`                               |
| `AI_REQUEST_LIMIT`               | AI request limit                                |   ✘      | `100`                                         |
| `STRIPE_SECRET_KEY`              |                                                 |   +      |                                               |
| `STRIPE_PUBLISHABLE_KEY`         |                                                 |   +      |                                               |
| `STRIPE_WEBHOOK_SECRET`          |                                                 |   +      |                                               |
| `STRIPE_DEFAULT_FREE_PRICE_ID`   | Free price id                                   |   +      |                                               |
| `STRIPE_PRO_PRODUCT_ID`          |                                                 |   +      |                                               |
| `STRIPE_FREE_PRODUCT_ID`         |                                                 |   +      |                                               |
| `REDIS_OAUTH_STATE_TTL`          | Redis oauth state cache ttl                     |   ✘      | `180`                                         |
| `REDIS_OAUTH_STATE_PREFIX`       | Redis oauth state cache prefix                   |   ✘      | `oauth_state:`                                |

Also check library environment variables:

https://github.com/protocolr/protocolr-amqp-lib#environment-variables

https://github.com/protocolr/protocolr-mongo-lib#environment-variables

https://github.com/protocolr/protocolr-auth-lib#environment-variables

## OAuth2 app

App used for fetching google workspace users and inviting them to team


Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/google-workspace/callback`
