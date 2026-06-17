import { RateLimiterRedis } from 'rate-limiter-flexible'
import { TooManyRequestsError } from 'restify-errors'
import { redisClient } from '../redis'

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // 100 requests
  duration: 60, // Per minute
})

export default async function (req, res, next) {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectKey = `${workspaceId}.${projectId}`
    const userKey = req.user._id
    await rateLimiter.consume(
      projectKey,
      1,
      { customDuration: 60 }, // custom duration can be set per workspace or per project if we want
    )

    try {
      await rateLimiter.consume(
        userKey,
        10,
        { customDuration: 3 }, // 5 requests per 3 seconds
      )
    } catch (err) {
      await rateLimiter.reward(projectKey, 1)
      return next(new TooManyRequestsError('You have made too many requests in a short period. Please wait before trying again.'))
    }
    next()
  } catch (err) {
    return next(new TooManyRequestsError('You have exceeded the allowed number of requests for this project in a short period. Please wait for a while before trying again'))
  }
}