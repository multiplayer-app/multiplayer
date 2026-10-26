import {
  ATTR_DB_SYSTEM_NAME,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_REQUEST_METHOD_ORIGINAL,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_URL_FULL,
  ATTR_URL_PATH,
  ATTR_URL_QUERY,
  ATTR_URL_SCHEME,
  SEMATTRS_DB_SYSTEM,
  SEMATTRS_HTTP_HOST,
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_TARGET,
  SEMATTRS_HTTP_URL,
  SEMATTRS_MESSAGING_DESTINATION,
  SEMATTRS_RPC_METHOD,
  SEMATTRS_RPC_SERVICE,
  SEMATTRS_RPC_SYSTEM,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions'

// Producers emit either the legacy (pre-stable) semantic conventions or only the stable
// ones, depending on SDK/instrumentation version. Readers ask for an attribute by either
// name and get the value from whichever form the producer actually sent.

// Only exported from the incubating semconv entry point.
const ATTR_MESSAGING_DESTINATION_NAME = 'messaging.destination.name'
const ATTR_RPC_SYSTEM_NAME = 'rpc.system.name'

type AttributeLookup = (key: string) => unknown

const isPresent = (value: unknown): boolean => value !== undefined && value !== null && value !== ''

// db.system.name renamed some db.system values - map them back so the same database
// resolves to the same value regardless of the producer's semconv version.
const LEGACY_DB_SYSTEM_BY_NAME: Record<string, string> = {
  'actian.ingres': 'ingres',
  'aws.dynamodb': 'dynamodb',
  'aws.redshift': 'redshift',
  'azure.cosmosdb': 'cosmosdb',
  firebirdsql: 'firebird',
  'gcp.spanner': 'spanner',
  h2database: 'h2',
  'ibm.db2': 'db2',
  'ibm.informix': 'informix',
  'ibm.netezza': 'netezza',
  'intersystems.cache': 'intersystems_cache',
  'microsoft.sql_server': 'mssql',
  'oracle.db': 'oracle',
  'sap.hana': 'hanadb',
  'sap.maxdb': 'maxdb',
  'softwareag.adabas': 'adabas',
}

const DEFAULT_PORT_BY_SCHEME: Record<string, number> = {
  http: 80,
  https: 443,
}

// Stable rpc.method is fully qualified (`package.Service/Method`) and replaces rpc.service.
const splitRpcMethod = (value: unknown): { service: string, method: string } | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const separatorIndex = value.lastIndexOf('/')

  if (separatorIndex <= 0) {
    return undefined
  }

  return {
    service: value.slice(0, separatorIndex),
    method: value.slice(separatorIndex + 1),
  }
}

// Renamed 1:1 - resolvable in both directions.
const LEGACY_BY_STABLE: Record<string, string> = {
  [ATTR_HTTP_REQUEST_METHOD]: SEMATTRS_HTTP_METHOD,
  [ATTR_HTTP_RESPONSE_STATUS_CODE]: SEMATTRS_HTTP_STATUS_CODE,
  [ATTR_URL_FULL]: SEMATTRS_HTTP_URL,
  [ATTR_DB_SYSTEM_NAME]: SEMATTRS_DB_SYSTEM,
  [ATTR_MESSAGING_DESTINATION_NAME]: SEMATTRS_MESSAGING_DESTINATION,
  [ATTR_RPC_SYSTEM_NAME]: SEMATTRS_RPC_SYSTEM,
  [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
}

const LEGACY_FROM_STABLE: Record<string, (lookup: AttributeLookup) => unknown> = {
  [SEMATTRS_HTTP_METHOD]: (lookup) => {
    const method = lookup(ATTR_HTTP_REQUEST_METHOD)

    // Stable semconv reports non-standard verbs as `_OTHER` and keeps the original separately.
    return method === '_OTHER'
      ? lookup(ATTR_HTTP_REQUEST_METHOD_ORIGINAL) ?? method
      : method
  },
  [SEMATTRS_HTTP_STATUS_CODE]: (lookup) => lookup(ATTR_HTTP_RESPONSE_STATUS_CODE),
  [SEMATTRS_HTTP_URL]: (lookup) => lookup(ATTR_URL_FULL),
  [SEMATTRS_HTTP_TARGET]: (lookup) => {
    const path = lookup(ATTR_URL_PATH)

    if (!isPresent(path)) {
      return undefined
    }

    const query = lookup(ATTR_URL_QUERY)

    return isPresent(query) ? `${path}?${query}` : path
  },
  [SEMATTRS_HTTP_HOST]: (lookup) => {
    const address = lookup(ATTR_SERVER_ADDRESS)

    if (!isPresent(address)) {
      return undefined
    }

    const port = Number(lookup(ATTR_SERVER_PORT))
    const scheme = lookup(ATTR_URL_SCHEME) as string | undefined
    // Legacy http.host mirrored the Host header, which omits the scheme's default port.
    const isDefaultPort = !port
      || (scheme ? DEFAULT_PORT_BY_SCHEME[scheme] === port : Object.values(DEFAULT_PORT_BY_SCHEME).includes(port))

    return isDefaultPort ? address : `${address}:${port}`
  },
  [SEMATTRS_DB_SYSTEM]: (lookup) => {
    const name = lookup(ATTR_DB_SYSTEM_NAME)

    return LEGACY_DB_SYSTEM_BY_NAME[name as string] ?? name
  },
  [SEMATTRS_MESSAGING_DESTINATION]: (lookup) => lookup(ATTR_MESSAGING_DESTINATION_NAME),
  [SEMATTRS_RPC_SYSTEM]: (lookup) => lookup(ATTR_RPC_SYSTEM_NAME),
  [SEMATTRS_RPC_SERVICE]: (lookup) => splitRpcMethod(lookup(SEMATTRS_RPC_METHOD))?.service,
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: (lookup) => lookup(ATTR_DEPLOYMENT_ENVIRONMENT_NAME),
}

export const getAttribute = (lookup: AttributeLookup, key: string): unknown => {
  const value = lookup(key)

  if (isPresent(value)) {
    return key === SEMATTRS_RPC_METHOD
      ? splitRpcMethod(value)?.method ?? value
      : value
  }

  const legacyKey = LEGACY_BY_STABLE[key]

  if (legacyKey) {
    return lookup(legacyKey)
  }

  return LEGACY_FROM_STABLE[key]?.(lookup)
}

// For attributes already flattened into a plain object (e.g. ClickHouse SpanAttributes).
export const getAttributeFromMap = (attributes: object | undefined, key: string): any => {
  if (!attributes) {
    return undefined
  }

  return getAttribute((attributeKey) => attributes[attributeKey], key)
}
