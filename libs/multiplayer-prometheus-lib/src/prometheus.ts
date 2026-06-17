import Prometheus from 'prom-client'

export class DefaultPrometheusClient {
  protected readonly register: Prometheus.Registry
  constructor() {
    this.register = new Prometheus.Registry()
  }

  collectDefaultMetrics(defaultLabels: Record<string, string>) {
    this.register.setDefaultLabels(defaultLabels)
    Prometheus.collectDefaultMetrics({ register: this.register })
  }

  getContentType() {
    return this.register.contentType
  }
  getMetrics() {
    return this.register.metrics()
  }
}

export const defaultPrometheusClient = new DefaultPrometheusClient()

