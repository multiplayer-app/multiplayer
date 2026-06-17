import { Request, Response, NextFunction } from 'express'
import { DefaultPrometheusClient } from './prometheus'

export default function (prometheusClient: DefaultPrometheusClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader('Content-Type', prometheusClient.getContentType())
      const metrics = await prometheusClient.getMetrics()
      res.status(200).send(metrics)
    } catch (err) {
      return next(err)
    }
  }
}
