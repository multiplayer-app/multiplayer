import * as Auth from '@multiplayer/auth'
import signature from 'cookie-signature'
import cookie from 'cookie'
import crypto from 'crypto'

const generateCookie = (name, val, secret, options) => {
  const signed = 's:' + signature.sign(val, secret)
  const data = cookie.serialize(name, signed, options)

  return data
}

export const generateSession = async (userId) => {
  const sid = crypto.randomBytes(16).toString('hex')

  const sessionData = {
    users: [userId],
    current: userId,
    cookie: {
      expires: new Date(new Date().valueOf() + 1000000000),
    },
  }

  await Auth.createSession(sid, sessionData)

  const cookieString = generateCookie(
    Auth.Config.COOKIE_NAME,
    sid.toString(),
    Auth.Config.COOKIE_SECRET,
    Auth.cookieOptions,
  )
  return cookieString
}
