# Multiplayer Notification service

## Variables

| Variable name               | Description                                     | Required | Default                                       |
|-----------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `PORT`                      | App listen http port. Ex.: `3000`               |   ✘      | 3000                                          |
| `HTTP_HOST`                 | App listen http host. Ex.: `127.0.0.1`          |   ✘      | 0.0.0.0                                       |
| `API_PREFIX`                | App http uri prefix. Ex.: `/v1`                  |   ✘      | `/api/v0`                                     |
| `SWAGGER_ENABLED`           | Enable Swagger                                  |   ✘      | `false`                                       |
| `CORS_DOMAIN`               | Cors domain                                     |   ✘      | `*`                                           |
| `FRONTEND_DOMAIN`           | Frontend domain. Ex.: `app.multiplayer.com`     |   ✘      | `localhost`                                   |
| `FRONTEND_PROTOCOL`         | Frontend protocol                               |   ✘      | `https`                                       |
| `AMQP_LISTEN_QUEUE`         | Amqp queue for notifications to listen           |   ✘      | `notification`                                 |
| `FROM_EMAIL`                | Send from email                                 |   ✘      | `no-reply@multiplayer.app`                    |
| `POSTMARK_API_TOKEN`        | Postmark api token                              |   ✘      |                                               |
| `SPARKPOST_API_TOKEN`       | Sparkpost api token                             |   ✘      |                                               |
| `SENDGRID_API_KEY`          | Sendgrid api token                              |   ✘      |                                               |
| `MANDRILL_API_KEY`          | Mandrill api token                              |   ✘      |                                               |

Also check library environment variables:

https://github.com/protocolr/protocolr-amqp-lib#environment-variables

https://github.com/protocolr/protocolr-auth-lib#environment-variables
