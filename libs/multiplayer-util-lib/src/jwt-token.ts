import jwt from 'jsonwebtoken'

export const generateJwtToken = (payload: object, secret: string, options?: { expiresIn: number }): string => {
  return jwt.sign(
    payload,
    secret,
    { ...(options || {}), algorithm: 'HS256' },
  )
}

export const decodeJwtToken = (jwtToken: string, secret?: string): any => {
  if (secret) {
    return jwt.verify(jwtToken, secret)
  }

  return jwt.decode(jwtToken)
}

export const isValidJwtToken = (jwtToken: string, secret: string): boolean => {
  try {
    jwt.verify(jwtToken, secret)

    return true
  } catch {
    return false
  }
}
