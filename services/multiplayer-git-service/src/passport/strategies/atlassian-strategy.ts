import Passport from 'passport'
import AtlassianStrategy from 'passport-atlassian-oauth2'
import {
  ATLASSIAN_APP_ID,
  ATLASSIAN_APP_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
} from '../../config'

interface LinearUser {
  id: string
  username: string
  emails: { value: string }[]
}

export const init = (passport: Passport.Authenticator) => passport.use(
  new AtlassianStrategy({
    clientID: ATLASSIAN_APP_ID,
    clientSecret: ATLASSIAN_APP_SECRET,
    scope: 'offline_access read:me write:jira-work read:jira-work read:workflow:jira',
    callbackURL: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/integrations/atlassian/callback`,
    pkce: true,
    // eslint-disable-next-line
    // @ts-ignore
    state: true,
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: LinearUser,
    done: (err: Error | null, data: any) => void,
  ) => {
    return done(
      null,
      {
        accessToken,
        refreshToken,
        profile,
      },
    )
  }),
)
