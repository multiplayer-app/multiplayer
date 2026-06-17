import { Strategy as GitHubStrategy } from 'passport-github2'
import Passport from 'passport'
import { IUserDocument } from '@multiplayer/models'
import {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
} from '../../config'

export const init = (passport: Passport.Authenticator) => passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/github/callback`,
  scope: ['user:email'],
  pkce: true,
  // eslint-disable-next-line
  // @ts-ignore
  state: true,
},
async (
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: (err: Error | null, user: IUserDocument) => void) => {
  return done(null, profile)
},
))
