# Multiplayer GIT service

## Variables

| Variable name                   | Description                                     | Required | Default                                       |
|---------------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `CORS_DOMAIN`                   | CORS domain                                     |   ✘      | `*`                                           |
| `PORT`                          | App listen http port. Ex.: `3000`               |   ✘      | 3000                                          |
| `API_PREFIX`                    | App http uri prefix. Ex.: `/v1/git`              |   ✘      | /v0/git                                       |
| `API_DOMAIN`                    | Api domain                                      |   ✘      | `localhost`                                   |
| `API_PROTOCOL`                  | Api protocol                                    |   ✘      | `https`                                       |
| `FRONTEND_DOMAIN`               | Frontend domain. Ex.: `app.multiplayer.com`     |   ✘      | `localhost`                                   |
| `FRONTEND_PROTOCOL`             | Frontend protocol                               |   ✘      | `https`                                       |
| `SWAGGER_ENABLED`               | Enable Swagger                                  |   ✘      | `false`                                       |
| `GIT_GITHUB_CLIENT_ID`          | (deprecated) Github oauth client id             |   ✘      |                                               |
| `GIT_GITHUB_CLIENT_SECRET`      | (deprecated) Github oauth client secret         |   ✘      |                                               |
| `GIT_GITLAB_APP_ID`             | Gitlab oauth app id                             |   ✔      |                                               |
| `GIT_GITLAB_APP_SECRET`         | Gitlab oauth app secret                         |   ✔      |                                               |
| `GIT_BITBUCKET_CLIENT_ID`       | Bitbucket oauth client id                       |   ✔      |                                               |
| `GIT_BITBUCKET_CLIENT_SECRET`   | Bitbucket oauth client secret                   |   ✔      |                                               |
| `GIT_GITHUB_APP_ID`             |                                                 |   ✔      |                                               |
| `GIT_GITHUB_APP_CLIENT_ID`      |                                                 |   ✔      |                                               |
| `GIT_GITHUB_APP_CLIENT_SECRET`  |                                                 |   ✔      |                                               |
| `GIT_GITHUB_APP_WEBHOOK_SECRET` |                                                 |   ✔      |                                               |
| `GIT_GITHUB_APP_PRIVATE_KEY`    |                                                 |   ✔      |                                               |
| `ATLASSIAN_APP_ID`              |                                                 |   ✔      |                                               |
| `ATLASSIAN_APP_SECRET`          |                                                 |   ✔      |                                               |
| `LINEAR_APP_ID`                 |                                                 |   ✔      |                                               |
| `LINEAR_APP_SECRET`             |                                                 |   ✔      |                                               |
| `AMQP_EVENT_QUEUE`              |                                                 |   ✘      | `event`                                       |
| `AMQP_INTEGRATION_EVENT_QUEUE`  |                                                 |   ✘      | `integration-event`                           |
| `AMQP_NOTIFICATION_QUEUE`       |                                                 |   ✘      | `notification`                                 |
| `GIT_GITLAB_ACCESS_TOKEN`       |                                                 |   ✔      |                                               |
| `INTEGRATION_JWT_SECRET`        |                                                 |   ✘      | `sample_jwt_secret`                           |
| `REDIS_OAUTH_STATE_TTL`         | Redis oauth state cache ttl                     |   ✘      | `180`                                         |
| `REDIS_OAUTH_STATE_PREFIX`      | Redis oauth state cache prefix                   |   ✘      | `oauth_state:`                                |

Also check library environment variables:

https://github.com/protocolr/protocolr-mongo-lib#environment-variables

https://github.com/protocolr/protocolr-auth-lib#environment-variables


## Oauth:

### Bitbucket

https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/integrations/bitbucket/callback`

Scopes: `repository:write`, `account`, `webhook`

### Github Oauth

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/integrations/github/callback`

Scope: `repo`

https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app

Note: `Enable Device Flow` should be disabled

### Github APP

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/integrations/github/callback`

Post installation setup url: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/integrations/github-app/post-install`
Webhook url: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/integrations/github-app/webhooks`
Home page: `https://go.multiplayer.app`

Note private key should be converted
```bash
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private-key.pem -out private-key-pkcs8.key
```

Permissions:

```
Contents: read & write
Metadata: read only
Pull requests: read & write

```

Scope: `repo`

https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app

Note: `Enable Device Flow` should be disabled


### Gitlab

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/integrations/gitlab/callback`

Scope: `write_repository`, `read_repository`, `read_user`, `api`

https://docs.gitlab.cn/14.0/ee/integration/oauth_provider.html

Api key: set value to `GIT_GITLAB_ACCESS_TOKEN`. Permissions: `api` `read_api`. Used for reading public repos


## Atlassian

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/integrations/atlassian/callback`

Scope: `read:me write:jira-work read:jira-work read:workflow:jira`

https://developer.atlassian.com/console/myapps/

## Linear

Redirect uri: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/integrations/linear/callback`

Scope: `write_repository`, `read_repository`, `read_user`, `api`

https://linear.app/settings/api/applications/new
