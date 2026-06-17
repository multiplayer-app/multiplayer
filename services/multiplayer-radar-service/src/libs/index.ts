import { KafkaConsumer, KafkaProducer } from '@multiplayer/kafka'
import { Config as ApmConfig } from '@multiplayer/apm'

export * as OtlpLib from './otlp.lib'
export * as RadarDetectionLib from './radar-detection.lib'
export const kafkaConsumer = new KafkaConsumer(ApmConfig.SERVICE_NAME)
export const kafkaProducer = new KafkaProducer()
export * as FlowsLib from './flows.lib'
export { default as openai } from './openai'
export * as IssueSettingsLib from './issue-settings.lib'
export * as AgentChatLib from './agent-chat.lib'
