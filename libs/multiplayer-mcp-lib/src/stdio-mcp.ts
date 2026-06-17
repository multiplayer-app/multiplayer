import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { MultiplayerMcpServer } from './server'
import { AuthType } from './interfaces'
import { jwtDecode } from 'jwt-decode'

const apiKey = process.env.MULTIPLAYER_API_KEY

if (!apiKey) {
  // eslint-disable-next-line
  console.error('MULTIPLAYER_API_KEY is not set.')
  process.exit(1)
}

const apiKeyData = jwtDecode(apiKey) as any
if (!apiKeyData.workspace || !apiKeyData.project) {
  // eslint-disable-next-line
  console.error('MULTIPLAYER_API_KEY has invalid format')
  process.exit(1)
}

const server = new MultiplayerMcpServer({
  authKey: process.env.MULTIPLAYER_API_KEY as string,
  authType: AuthType.API_KEY,
  workspace: apiKeyData.workspace,
  project: apiKeyData.project,
})

async function main() {
  const transport = new StdioServerTransport()
  await server.getServer().connect(transport)
  // eslint-disable-next-line
  console.error('Multiplayer MCP Server running on stdio')
}

main().catch((error) => {
  // eslint-disable-next-line
  console.error('Fatal error in main():', error)
  process.exit(1)
})