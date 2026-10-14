import { KafkaConsumer, KafkaProducer } from '@multiplayer/kafka'
import { Config as ApmConfig } from '@multiplayer/apm'

export * as OtlpLib from './otlp.lib'
export * as RadarDetectionLib from './radar-detection.lib'
export const kafkaConsumer = new KafkaConsumer(ApmConfig.SERVICE_NAME)
// Separate consumer group for the analytics-Store-backed topics (debug-session
// spans/logs/rrweb, error spans). With ANALYTICS_DB_ENGINE=duckdb only the elected
// store leader runs it (see app.ts leadership hooks) so ingest writes stay local to the
// leader's file and messages queue durably in Kafka across failovers; with clickhouse
// it runs on every replica, load-balanced, same as before the split.
export const kafkaStoreConsumer = new KafkaConsumer(`${ApmConfig.SERVICE_NAME}-store`)
export const kafkaProducer = new KafkaProducer()
export * as FlowsLib from './flows.lib'
export { default as openai } from './openai'
export * as IssueSettingsLib from './issue-settings.lib'
export * as AgentChatLib from './agent-chat.lib'
