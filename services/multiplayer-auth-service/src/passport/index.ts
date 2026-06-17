import passport from 'passport'
import { IUserDocument } from '@multiplayer/models'
import {
  PassportGithubStrategy,
  PassportGitlabStrategy,
  PassportGoogleStrategy,
  PassportLocalStrategy,
} from './strategies'

passport.serializeUser((user, done) => {
  return done(null, user)
})

passport.deserializeUser((obj: IUserDocument, done) => {
  return done(null, obj)
})

PassportGithubStrategy.init(passport)
PassportGitlabStrategy.init(passport)
PassportGoogleStrategy.init(passport)
PassportLocalStrategy.init(passport)

export default passport
