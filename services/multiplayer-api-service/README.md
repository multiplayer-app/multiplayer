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
| `INTERNAL_COLLABORATION_SERVICE_URI` | Internal base URI for multiplayer-collaboration-service |   ✘      | `http://localhost:3002/internal/v0/collaboration` |
| `MARKETING_EMAIL`                | Email to send emails from contact form          |   ✘      | `hello@multiplayer.app`                       |
| `SUPPORT_EMAIL`                  | Email to send user feedback                     |   ✘      | `support@multiplayer.app`                     |
| `API_DOMAIN`                     | Domain used to build OAuth callback/webhook URLs |   ✘      | `localhost`                                   |
| `API_PROTOCOL`                   | Protocol used to build OAuth callback/webhook URLs |  ✘    | `https`                                       |
| `GOOGLE_CLIENT_ID`               | Shared by the Google Workspace app *and* "Login with Google" - see [OAuth apps](#oauth-apps) |   +      |                                               |
| `GOOGLE_CLIENT_SECRET`           | Shared by the Google Workspace app *and* "Login with Google" - see [OAuth apps](#oauth-apps) |   +      |                                               |
| `GITHUB_CLIENT_ID`               | "Login with GitHub" OAuth app - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GITHUB_CLIENT_SECRET`           | "Login with GitHub" OAuth app - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GITLAB_APP_ID`                  | "Login with GitLab" OAuth app - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GITLAB_APP_SECRET`              | "Login with GitLab" OAuth app - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GIT_GITHUB_APP_ID`              | GitHub App (repo integration) - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GIT_GITHUB_APP_CLIENT_ID`       | GitHub App (repo integration) - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GIT_GITHUB_APP_CLIENT_SECRET`   | GitHub App (repo integration) - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GIT_GITHUB_APP_WEBHOOK_SECRET`  | GitHub App (repo integration) - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GIT_GITHUB_APP_PRIVATE_KEY`     | GitHub App (repo integration) - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GIT_GITLAB_APP_ID`              | GitLab OAuth app (repo integration) - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
| `GIT_GITLAB_APP_SECRET`          | GitLab OAuth app (repo integration) - see [OAuth apps](#oauth-apps) |   ✘      |                                               |
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

## OAuth apps

All redirect/callback and webhook URLs below are built as
`{API_PROTOCOL}://{API_DOMAIN}{API_PREFIX}/...`, e.g. with the defaults this is
`https://localhost/v0/api/...`.

### Google Workspace app

App used for fetching Google Workspace users and inviting them to the team.

- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Redirect URI: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/google-workspace/callback`

### Login OAuth apps (`/v0/api/auth/...`)

These power "Sign in with ..." on the login page. Each is a separate OAuth app
registration from its git-integration counterpart below, even where the
provider is the same (GitHub, GitLab) - a signed-in user and a connected
repository integration are different concerns with different scopes.

| Provider | Env vars | Scope | Redirect URI |
|----------|----------|-------|---------------|
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `user:email` | `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/auth/github/callback` |
| GitLab | `GITLAB_APP_ID`, `GITLAB_APP_SECRET` | `read_user` | `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/auth/gitlab/callback` |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `profile`, `email` | `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/auth/google/callback` |

> **Note:** the Google login app currently shares the exact same
> `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars as the Google Workspace app
> above - they're two different features (user login vs. fetching directory
> users) reusing the same OAuth client. If you ever need them to diverge
> (e.g. different consent screens or scopes), they'll need to be split into
> separate env vars and a second Google Cloud OAuth client.

### Git integration OAuth apps (`/v0/api/git/...`)

These power "Connect your repository" in project/workspace integrations. All
are registered as internal passport strategies with a distinct name from the
login ones above (e.g. GitLab integration is `gitlab-integration`, not
`gitlab`), since both live in the same passport instance.

| Provider | Env vars | Scope | Redirect URI |
|----------|----------|-------|---------------|
| GitHub App | `GIT_GITHUB_APP_ID`, `GIT_GITHUB_APP_CLIENT_ID`, `GIT_GITHUB_APP_CLIENT_SECRET`, `GIT_GITHUB_APP_WEBHOOK_SECRET`, `GIT_GITHUB_APP_PRIVATE_KEY` | (set on the GitHub App itself) | Webhook URL: `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/git/integrations/github-app/webhooks` |
| GitLab | `GIT_GITLAB_APP_ID`, `GIT_GITLAB_APP_SECRET` | `write_repository read_repository read_user api` | `{{API_PROTOCOL}}://{{API_DOMAIN}}{{API_PREFIX}}/git/integrations/gitlab/callback` |

GitHub repository access goes through a **GitHub App** installation
(install/uninstall flow + webhooks), not a classic OAuth app - there's a
disabled classic-OAuth GitHub strategy for git integration in the codebase
(`GIT_GITHUB_CLIENT_ID`/`GIT_GITHUB_CLIENT_SECRET`), but it isn't wired up;
the GitHub App is what's actually used.

Bitbucket, Atlassian, and Linear (repository/issue-tracker integrations) and
Slack (notifications) also have their own OAuth apps under `/v0/api/git/...`,
configured via `GIT_BITBUCKET_CLIENT_ID`/`GIT_BITBUCKET_CLIENT_SECRET`,
`ATLASSIAN_APP_ID`/`ATLASSIAN_APP_SECRET`, `LINEAR_APP_ID`/`LINEAR_APP_SECRET`,
and `SLACK_CLIENT_ID`/`SLACK_CLIENT_SECRET`/`SLACK_SIGNING_SECRET`
respectively, following the same `{{API_PREFIX}}/git/integrations/{provider}/callback` pattern.
