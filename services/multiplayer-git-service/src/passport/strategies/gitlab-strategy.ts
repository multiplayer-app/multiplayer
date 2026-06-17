import Passport from 'passport'
import { Strategy as GitLabStrategy } from 'passport-gitlab2'
import {
  GIT_GITLAB_APP_ID,
  GIT_GITLAB_APP_SECRET,
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
  clientID: GIT_GITLAB_APP_ID,
  clientSecret: GIT_GITLAB_APP_SECRET,
  scope: ['write_repository', 'read_repository', 'read_user', 'api'].join(' '),
  callbackURL: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/integrations/gitlab/callback`,
  pkce: true,
  // eslint-disable-next-line
  // @ts-ignore
  state: true,
},
async (accessToken: string, refreshToken: string, profile: GitlabUser, done: (err: Error | null, data: any) => void) => {
  return done(
    null,
    {
      accessToken,
      refreshToken,
      profile,
    },
  )
}))
