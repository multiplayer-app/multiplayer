# Models lib

DEFAULT_USER_TIMEZONE
SALT_ROUNDS

## Seed

```bash
ts-node libs/multiplayer-models-lib/seed/invitiation-token.ts  -- --token={{INVITE_CODE}}

ts-node libs/multiplayer-models-lib/seed/counter.ts
```

## Variables

| Variable name               | Description                                     | Required | Default                                       |
|-----------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `DEFAULT_USER_TIMEZONE`     | Default user time zone                          |   ✘      | `America/New_York`                            |
| `SALT_ROUNDS`               | Salt rounds                                     |   ✘      | `10`                                          |
