import { PayloadTooLargeError } from 'restify-errors'

export default function(limitInBytes = 100 * 1024) {
  return (req, res, next) => {
    try {
      const sizeInBytes = Buffer.byteLength(JSON.stringify(req.body), 'utf8')
      if (sizeInBytes > limitInBytes) {
        next(new PayloadTooLargeError('Payload is larger than 100Kb'))
        return
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}