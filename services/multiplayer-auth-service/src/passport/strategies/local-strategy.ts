import { Strategy as PassportLocalStrategy } from 'passport-local'
import restifyErrors from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'
import { UserModel } from '@multiplayer/models'
import {
  BlockedUserCache,
  UserLoginAttempts,
} from '../../cache'
import { MAX_USER_LOGIN_ATTEMPTS } from '../../config'

const { UnauthorizedError } = restifyErrors

export const init = passport => passport.use(new PassportLocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false,
    session: false,
  },
  async (email, password, done) => {
    try {
      const user = await UserModel.findByLocalEmail(email)

      if (!user) {
        return done(new UnauthorizedError(ErrorMessage.INVALID_PASSWORD_OR_EMAIL), null)
      }

      const userId = user._id.toString()
      const isUserBlocked = await BlockedUserCache.get(userId)

      if (isUserBlocked) {
        return done(new UnauthorizedError(ErrorMessage.USER_ACCOUNT_BLOCKED), null)
      }

      if (!(await user.verifyLocalPassword(password))) {
        const failedLoginAttemptsCount = await UserLoginAttempts.increment(userId)

        if (failedLoginAttemptsCount >= MAX_USER_LOGIN_ATTEMPTS) {
          await BlockedUserCache.set(userId)
        }

        return done(new UnauthorizedError(ErrorMessage.INVALID_PASSWORD_OR_EMAIL), null)
      }

      await UserLoginAttempts.remove(userId)

      return done(null, user)
    } catch (err) {
      return done(err, null)
    }
  },
))
