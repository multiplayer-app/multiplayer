import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
} from '../../config'

interface GoogleUser {
  id: string
  name: {
    givenName: string
    familyName: string
  }
  emails: { value: string }[]
}

export const init = passport => passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/google/callback`,
  scope: ['profile', 'email'],
  pkce: true,
  // eslint-disable-next-line
  // @ts-ignore
  state: true,
},
async (
  accessToken: string,
  refreshToken: string,
  profile: GoogleUser,
  done: (err: Error | null, profile: GoogleUser) => void,
) => {
  return done(null, profile)
}))
