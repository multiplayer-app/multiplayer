# Multiplayer authentication service

## Variables

| Variable name               | Description                                     | Required | Default                                       |
|-----------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `CORS_DOMAIN`               | CORS domain                                     |   ✘      | `*`                                           |
| `PORT`                      | App listen http port. Ex.: `3000`               |   ✘      | 3000                                          |
| `API_PREFIX`                | App http uri prefix. Ex.: `/v1/auth`             |   ✘      | /v0/auth                                      |
| `API_DOMAIN`                | Api domain                                      |   ✘      | `localhost`                                   |
| `API_PROTOCOL`              | Api protocol                                    |   ✘      | `https`                                       |
| `FRONTEND_DOMAIN`           | Frontend domain. Ex.: `app.multiplayer.com`     |   ✘      | `localhost`                                   |
| `FRONTEND_PROTOCOL`         | Frontend protocol                               |   ✘      | `https`                                       |
| `SWAGGER_ENABLED`           | Enable Swagger                                  |   ✘      | `false`                                       |
| `GITHUB_CLIENT_ID`          | Github oauth client id                          |   ✔      |                                               |
| `GITHUB_CLIENT_SECRET`      | Github oauth client secret                      |   ✔      |                                               |
| `GITLAB_APP_ID`             | Gitlab oauth app id                             |   ✔      |                                               |
| `GITLAB_APP_SECRET`         | Gitlab oauth app secret                         |   ✔      |                                               |
| `GOOGLE_CLIENT_ID`          | Google oauth client id                          |   ✔      |                                               |
| `GOOGLE_CLIENT_SECRET`      | Google oauth client secret                      |   ✔      |                                               |
| `AMQP_NOTIFICATION_QUEUE`   | Amqp notification queue                          |   ✘      | `notification`                                 |

Also check library environment variables:

https://github.com/protocolr/protocolr-mongo-lib#environment-variables

https://github.com/protocolr/protocolr-auth-lib#environment-variables


## Oauth:

### Google

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/google/callback`

### Github

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/github/callback`

Scope: `user:email`

https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app

Note: `Enable Device Flow` should be disabled

### Gitlab

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/gitlab/callback`

Scope: `read_user`

https://docs.gitlab.cn/14.0/ee/integration/oauth_provider.html
