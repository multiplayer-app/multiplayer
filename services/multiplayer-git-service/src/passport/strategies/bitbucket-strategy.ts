import { Strategy as BitbucketStrategy } from 'passport-bitbucket-oauth2'
import {
  GIT_BITBUCKET_CLIENT_ID,
  GIT_BITBUCKET_CLIENT_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
} from '../../config'

export const init = passport => passport.use(new BitbucketStrategy({
  clientID: GIT_BITBUCKET_CLIENT_ID,
  clientSecret: GIT_BITBUCKET_CLIENT_SECRET,
  callbackURL: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/integrations/bitbucket/callback`,
  scope: ['repository:write', 'account', 'webhook'],
  pkce: true,
  // eslint-disable-next-line
  // @ts-ignore
  state: true,
},
async (accessToken: string, refreshToken: string, profile, done: (err: Error | null, data: any) => void) => {
  return done(
    null,
    {
      accessToken,
      refreshToken,
      profile,
    })
}))
