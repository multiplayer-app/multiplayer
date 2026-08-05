import passport from 'passport'
import { IUserDocument } from '@multiplayer/models'
import {
  PassportAtlassianStrategy,
  PassportBitbucketStrategy,
  PassportGitGitlabStrategy,
  // PassportGitGithubStrategy,
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

// git integrations
PassportGitGitlabStrategy.init(passport)
// PassportGitGithubStrategy.init(passport)
PassportBitbucketStrategy.init(passport)
PassportAtlassianStrategy.init(passport)

// user login
PassportGithubStrategy.init(passport)
PassportGitlabStrategy.init(passport)
PassportGoogleStrategy.init(passport)
PassportLocalStrategy.init(passport)

export default passport
