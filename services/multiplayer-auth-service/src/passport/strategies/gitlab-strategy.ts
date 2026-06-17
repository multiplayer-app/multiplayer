import Passport from 'passport'
import { Strategy as GitLabStrategy } from 'passport-gitlab2'
import {
  GITLAB_APP_ID,
  GITLAB_APP_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
} from '../../config'

interface GitlabUser {
  id: string
  username: string
  emails: { value: string }[]
}

export const init = (passport: Passport.Authenticator) => passport.use(new GitLabStrategy({
  clientID: GITLAB_APP_ID,
  clientSecret: GITLAB_APP_SECRET,
  scope: ['read_user'],
  callbackURL: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/gitlab/callback`,
  pkce: true,
  // eslint-disable-next-line
  // @ts-ignore
  state: true,
},
async (
  accessToken: string,
  refreshToken: string,
  profile: GitlabUser,
  done: (err: Error | null, user: GitlabUser) => void,
) => {
  return done(null, profile)
}))
