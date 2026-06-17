import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library'
import { google } from 'googleapis'
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
} from '../config'

export const getOAuth2Client = () => new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/google-workspace/callback`,
)

export const getAuthUrl = (
  state?: string,
  pkceOptions?: {
    codeChallenge: string,
    codeChallengeMethod: CodeChallengeMethod
  },
) => {
  const oAuth2Client = getOAuth2Client()

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    ],
    state,
    ...pkceOptions?.codeChallenge && pkceOptions?.codeChallengeMethod
      ? {
        code_challenge: pkceOptions.codeChallenge,
        code_challenge_method: pkceOptions.codeChallengeMethod,
      }
      : {},
  })
}

export const getGoogleWorkspaceUsers = async (authClient): Promise<Array<{ email: string }>> => {
  const service = google.admin({
    version: 'directory_v1',
    auth: authClient,
  })
  const response = await service.users.list({
    customer: 'my_customer',
  })

  const users = response.data.users

  return users?.map((user) => ({
    email: user.emails[0].address,
  })) || []
}
