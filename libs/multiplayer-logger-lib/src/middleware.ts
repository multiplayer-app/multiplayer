import type { Request, Response, NextFunction } from 'express'
import type { LogLevelString } from 'bunyan'
import { logger } from './logger'
import { isProduction } from './config'

const getDuration = (start: [number, number]) => {
  const diff = process.hrtime(start)
  return diff[0] * 1e3 + diff[1] * 1e-6
}

export const middleware = () => {
  const loggerMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.connection) {
      return next()
    }

    const reqStart = process.hrtime()

    const url = req.originalUrl || req.url

    if (!isProduction) {
      logger.info({
        req: {
          method: req.method,
          url,
          // headers: _maskHeaders(req.headers),
          query: req.query,
          // remoteAddress: req.connection.remoteAddress,
          // remotePort: req.connection.remotePort,
        },
      }, `${req.method} ${url}`)
    }

    res.on('finish', () => {
      const statusCode = res.statusCode || 200
      let level: LogLevelString = statusCode < 400 ? 'info' : 'error'

      if ((statusCode === 404 && url === '/') && isProduction) {
        return
      } else if (
        statusCode === 404
        || statusCode === 403) {
        level = 'warn'
      }

      // if (statusCode >= 200 && statusCode < 300) {
      //   return
      // }

      logger[level]({
        // res: {
        //   status: statusCode,
        //   headers: res.getHeaders(),
        //   method: req.method,
        // },
        // method: req.method,
        // duration: getDuration(reqStart),
      }, `${req.method} ${url}: ${statusCode} ${getDuration(reqStart)}ms`)
    })

    next()
  }

  return loggerMiddleware
}
