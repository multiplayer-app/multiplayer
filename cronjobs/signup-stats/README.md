## Variables

| Variable name               | Description              | Required | Default                                       |
|-----------------------------|--------------------------|----------|-----------------------------------------------|
| `SLACK_OAUTH_TOKEN`         |                          |   +      |                                               |
| `SLACK_API`                 |                          |   -      | `https://slack.com/api`                       |
| `SLACK_CHANNEL`             |                          |   +      |                                               |
| `PERIOD_MS`                 | Period in milliseconds   |   -      | `86400000`                                    |

## Slack scopes

Required slack oauth scopes:

```
chat:write
files:write
```
