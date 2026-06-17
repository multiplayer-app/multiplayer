import passport from 'passport'
import { IUserDocument } from '@multiplayer/models'
import {
  // PassportGithubStrategy,
  PassportGitlabStrategy,
  PassportBitbucketStrategy,
  PassportAtlassianStrategy,
} from './strategies'

passport.serializeUser((user, done) => {
  return done(null, user)
})

passport.deserializeUser((obj: IUserDocument, done) => {
  return done(null, obj)
})

// PassportGithubStrategy.init(passport)
PassportGitlabStrategy.init(passport)
PassportBitbucketStrategy.init(passport)
PassportAtlassianStrategy.init(passport)

export default passport
