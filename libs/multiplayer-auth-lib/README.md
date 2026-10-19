# Auth lib

## Environment variables:

### ALLOWED_EMAIL_DOMAINS
Comma-separated list of email domains allowed to sign in. Matching is exact and case-insensitive (subdomains are not included). Users whose primary email is outside the list can't log in or register, and their existing sessions and OAuth tokens are rejected. Empty means no restriction.
Example: `acme.com,acme.io`

### COOKIE_DOMAIN
Domain for cookie.
Example: BE - `api.multiplayer.com` and FE - `multiplayer.com` => `multiplayer.com`

### COOKIE_SECRET

Random string for cookie secret

### COOKIE_NAME

Auth cookie name. Default: `Multiplayer_SID`

### COOKIE_MAX_AGE

Cookie lifetime. Default is 168 * 60 * 60 * 1000 - 168 hours.

### NODE_ENV

If `NODE_ENV` === `production` and `APP_DOMAIN` NOT one of `local.multiplayer.com`, `localhost` or `127.0.0.1` - then cookie has secure === `true`.

### AUTH_HEADER_NAME

Default: `x-api-key`

#### Note:

Also check https://github.com/protocolr/protocolr-mongo-lib#environment-variables
