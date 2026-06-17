# Multiplayer Version service

## Variables

| Variable name               | Description                                     | Required | Default                                       |
|-----------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `PORT`                      | App listen http port. Ex.: `3000`               |   ✘      | 3000                                          |
| `CORS_DOMAIN`               | CORS                                            |   ✘      | `*`                                           |
| `API_PREFIX`                | App http uri prefix. Ex.: `/v1`                  |   ✘      | /v0/version                                   |
| `SWAGGER_ENABLED`           | Enable Swagger                                  |   ✘      | `false`                                       |
| `S3_HOST`                   | S3 endpoint                                     |   ✘      | `https://s3.amazonaws.com`                    |
| `S3_PRESIGNED_URL_EXPIRES`  | S3 presigned url expiration time                |   ✘      | 120                                           |
| `S3_PUBLIC_BUCKET`          | S3 bucket for public files                       |   ✘      | `public-bucket`                               |
| `S3_PRIVATE_BUCKET`         | S3 bucket for private files                      |   ✘      | `private-bucket`                              |
| `AWS_REGION`                | AWS region                                      |   ✔      |                                               |
| `DEFAULT_PAGINATION_LIMIT`  | Default pagination limit                        |   ✘      | `50`                                          |
| `DEFAULT_PAGINATION_OFFSET` | Default pagination offset                       |   ✘      | `0`                                           |
| `AMQP_EVENT_QUEUE`          |                                                 |   ✘      | `event`                                       |
| `AMQP_FORK_QUEUE`          |                                                 |   ✘      | `clone`                                       |
| `AMQP_CLEANUP_QUEUE`        |                                                 |   ✘      | `cleanup`                                     |

Also check library environment variables:

https://github.com/protocolr/protocolr-mongo-lib#environment-variables

https://github.com/protocolr/protocolr-auth-lib#environment-variables


## How it works:

### Create entity

1. Create entity `POST /entities`

### Commit

1. Create entity-commit `POST /entities/{entityId}/commits`
2. Upload file with presigned link to s3
3. Update Entity-Commit status `PATCH /entities/{entityId}/commits/{entityCommitId}` and set status (`DONE` or `ERROR`)
4. Create commit and attach entity commit `POST /branches/{branchId}/commits`
Note: only commits with `DONE` status can be attached to commit.

### Create branch

NOTE: `main` branch and first commit by default created when project created
1. Use `POST /branches` to create new branch.
Mention branch from which you want create new one in property `parentBranch` and commit `parentCommit`

### Get current project state

1. `GET /projects/{projectId}/branches/{branchId}/commits/{commitId}`
In response you will see list of entities with their entity-commits.

Keep in mind, in response can be some entity-commits from current branch and some from parent (For example if you changed file A in feature branch, but file B is not changed)
