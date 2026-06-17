import { Strategy as GitHubStrategy } from 'passport-github2'
import Passport from 'passport'
import {
  GIT_GITHUB_CLIENT_ID,
  GIT_GITHUB_CLIENT_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
} from '../../config'

export const init = (passport: Passport.Authenticator) => passport.use(new GitHubStrategy({
  clientID: GIT_GITHUB_CLIENT_ID,
  clientSecret: GIT_GITHUB_CLIENT_SECRET,
  callbackURL: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/integrations/github/callback`,
  scope: ['repo'],
  pkce: true,
  // eslint-disable-next-line
  // @ts-ignore
  state: true,
},
async (accessToken: string, refreshToken: string, profile: any, done: (err: Error | null, data: any) => void) => {
  return done(
    null,
    {
      accessToken,
      refreshToken,
      profile,
    },
  )
}))
