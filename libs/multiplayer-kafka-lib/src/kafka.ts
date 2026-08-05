import { Kafka, logLevel, SASLOptions } from 'kafkajs'
import { GoogleAuth } from 'google-auth-library'
import { KAFKA_CLIENT_ID, KAFKA_URI, KAFKA_AUTH_MECHANISM } from './config'
import { KafkaJsLogCreator } from '@multiplayer/logger'


const toBunyanLogLevel = level => {
  switch (level) {
    case logLevel.ERROR:
    case logLevel.NOTHING:
      return 'error'
    case logLevel.WARN:
      return 'warn'
    case logLevel.INFO:
      return 'info'
    case logLevel.DEBUG:
      return 'debug'
    default:
      return 'info'
  }
}

// Mirrors the Java `GcpLoginCallbackHandler` used by Google Cloud Managed
// Service for Apache Kafka's own client examples: exchange the pod's
// attached GCP service account (via Workload Identity on GKE, or ADC
// elsewhere) for an OAuth2 access token and present it as an OAUTHBEARER
// token. kafkajs has no Java-classpath equivalent, so this is reimplemented
// directly against google-auth-library.
const googleAuth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})

const gcpOauthBearerProvider = async () => {
  const client = await googleAuth.getClient()
  const { token } = await client.getAccessToken()

  if (!token) {
    throw new Error('Failed to obtain a GCP access token for Kafka OAUTHBEARER auth')
  }

  return { value: token }
}

const getSasl = (): SASLOptions | undefined => {
  if (KAFKA_AUTH_MECHANISM === 'gcp-oauthbearer') {
    return {
      mechanism: 'oauthbearer',
      oauthBearerProvider: gcpOauthBearerProvider,
    }
  }

  return undefined
}

export const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_URI,
  logCreator: KafkaJsLogCreator(toBunyanLogLevel),
  ssl: KAFKA_AUTH_MECHANISM === 'gcp-oauthbearer',
  sasl: getSasl(),
})
