import crypto from 'crypto'

const randomBytesAsync = (len): Promise<Buffer> => new Promise(
  (res, rej) => crypto.randomBytes(len, (err, buf) => {
    if (err) {
      return rej(err)
    }

    return res(buf)
  }))

export const generateRandomToken = async (len: number): Promise<string> => {
  return (await randomBytesAsync(Math.ceil(len / 2)))
    .toString('hex').slice(0, len)
}

export const generateRandomTokenSync = (len: number): string => {
  return crypto.randomBytes(Math.ceil(len / 2))
    .toString('hex').slice(0, len)
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
