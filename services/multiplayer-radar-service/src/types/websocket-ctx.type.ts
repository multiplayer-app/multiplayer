import { MultiplayerSession } from '@multiplayer/auth'
import { IIntegrationApiKeyJwtPaylaod } from '@multiplayer/types'

export interface WebsocketCtx {
  apiKey?: string
  session?: MultiplayerSession
  rawApiKeyPayload?: IIntegrationApiKeyJwtPaylaod
  currentUserId?: string
}
