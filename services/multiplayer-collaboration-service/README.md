# Multiplayer Collaboration service

## Variables

| Variable name                      | Description                                     | Required | Default                                       |
|------------------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `API_PREFIX`                       | App http uri prefix. Ex.: `/v1`                  |   ✘      | `/api/v0`                                     |
| `AMQP_COLLABORATION_EVENT_QUEUE`   | Amqp queue binded to event queue                |   ✘      | `collaboration-event`                         |
| `AMQP_EVENT_QUEUE`                 | Amqp exchange events queue                      |   ✘      | `event`                                       |
| `AMQP_COLLABORATION_RPC_QUEUE`     | Amqp rpc queue                                  |   ✘      | `collaboration-rpc`                           |
| `PORT`                             | App listen http port. Ex.: `3000`               |   ✘      | 3000                                          |
| `HTTP_HOST`                        | App listen http host. Ex.: `127.0.0.1`          |   ✘      | 0.0.0.0                                       |
| `SWAGGER_ENABLED`                  | Enable Swagger                                  |   ✘      | `false`                                       |
| `CORS_DOMAIN`                      | Cors domain                                     |   ✘      | `*`                                           |
| `API_SERVICE_URI`                  | api service url                                 |   ✘      | `http://localhost:3000/v0/api`                |
| `INTERNAL_GIT_SERVICE_URI`         | internal git service url                        |   ✘      | `http://localhost:3000/internal/v0/git`       |
| `INTERNAL_VERSION_SERVICE_URI`     | internal version service url                    |   ✘      | `http://localhost:3000/internal/v0/version`   |
| `VERSION_SERVICE_URI`              | version service url                             |   ✘      | `http://localhost:3000/v0/version`            |
