import Prometheus from 'prom-client'
import { DefaultPrometheusClient } from '@multiplayer/prometheus'

class PrometheusClient extends DefaultPrometheusClient {
  private readonly retryCounter: Prometheus.Counter
  private readonly activeDocsNumber: Prometheus.Gauge
  private readonly memoryUsedByDoc: Prometheus.Gauge
  private readonly usersInDoc: Prometheus.Gauge

  constructor() {
    super()
    this.retryCounter = new Prometheus.Counter({
      name: 'retry_internal_requests_total',
      help: 'Count of retried requests sent to connected services',
      labelNames: ['baseUrl'],
    })
    this.register.registerMetric(this.retryCounter)

    this.activeDocsNumber = new Prometheus.Gauge({
      name: 'yjs_active_docs_total',
      help: 'Number of yjs docs in memory',
    })
    this.register.registerMetric(this.activeDocsNumber)

    this.memoryUsedByDoc = new Prometheus.Gauge({
      name: 'yjs_active_doc_state_bytes',
      help: 'Size of active document state',
      labelNames: ['projectBranch', 'entityId'],
    })
    this.register.registerMetric(this.memoryUsedByDoc)

    this.usersInDoc = new Prometheus.Gauge({
      name: 'yjs_doc_users_total',
      help: 'Active users in doc',
      labelNames: ['projectBranch', 'entityId'],
    })
    this.register.registerMetric(this.usersInDoc)
  }

  updateRetryCounter(baseUrl: string) {
    this.retryCounter.labels({ baseUrl }).inc()
  }

  incUsersInDocNumber(projectBranch: string, entityId: string) {
    this.usersInDoc.labels({ projectBranch, entityId }).inc(1)
  }

  decUsersInDocNumber(projectBranch: string, entityId: string) {
    this.usersInDoc.labels({ projectBranch, entityId }).dec(1)
  }
}

export const prometheusClient = new PrometheusClient()

