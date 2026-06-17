export const MULTIPLAYER_BASE_API_URL = process.env.MULTIPLAYER_BASE_API_URL || 'https://api.multiplayer.app'
export const MULTIPLAYER_CLIENT_DOMAIN = process.env.MULTIPLAYER_CLIENT_DOMAIN || 'https://go.multiplayer.app'
export const MCP_NAME = 'multiplayer'
export const MCP_VERSION = '1.0.0'

// Hard timeout for any outbound request the MCP server makes back to the
// Multiplayer API / S3. Without this a single unreachable dependency turns a
// tool call into an infinite hang on the connector side.
export const MULTIPLAYER_REQUEST_TIMEOUT_MS =
  Number(process.env.MULTIPLAYER_MCP_REQUEST_TIMEOUT_MS) || 20_000

// Upper bound on the number of top-level timeline nodes returned for a single
// session, to keep tool responses from ballooning into multi-MB payloads.
export const MAX_SESSION_NODES =
  Number(process.env.MULTIPLAYER_MCP_MAX_SESSION_NODES) || 2_000
