export const SERVICE_NAME = process.env.npm_package_name
export const KAFKA_URI = (process.env.KAFKA_URI as string || 'localhost:29092').split(',')
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID as string || SERVICE_NAME
export const KAFKA_SESSION_TIMEOUT = Number.parseInt(process.env.KAFKA_SESSION_TIMEOUT || '30000')

// Auth mechanism for the Kafka broker connection. Defaults to plaintext
// (self-hosted Kafka, existing AWS/on-prem setup). Set to 'gcp-oauthbearer'
// to connect to Google Cloud Managed Service for Apache Kafka, which
// requires SASL_SSL + OAUTHBEARER using the pod's attached GCP service
// account (Workload Identity) instead of static credentials.
export const KAFKA_AUTH_MECHANISM = process.env.KAFKA_AUTH_MECHANISM as string || 'plain'
