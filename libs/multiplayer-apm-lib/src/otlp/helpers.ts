import { hostname } from 'os'
import { getResourceDetectors } from '@opentelemetry/auto-instrumentations-node'
import { resourceFromAttributes, detectResources } from '@opentelemetry/resources'
import * as SemanticAttributes from '@opentelemetry/semantic-conventions'
import {
  SERVICE_NAME,
  SERVICE_VERSION,
  PLATFORM_ENV,
} from '../config'

export const extractOtelHeadersFromEnv = (env: string) => {
  let headers = {}

  if (env) {
    headers = Object.fromEntries((env || '').split(',').filter(Boolean)
      .map(key => key.split('=')))
  }

  return headers
}

export const getResource = () => {
  const resourceWithAttributes = resourceFromAttributes({
    [SemanticAttributes.SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
    [SemanticAttributes.SEMRESATTRS_SERVICE_VERSION]: SERVICE_VERSION,
    [SemanticAttributes.SEMRESATTRS_HOST_NAME]: hostname(),
    [SemanticAttributes.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: PLATFORM_ENV,
    [SemanticAttributes.SEMRESATTRS_PROCESS_RUNTIME_VERSION]: process.version,
    [SemanticAttributes.SEMRESATTRS_PROCESS_PID]: process.pid,
    // 'multiplayer.platform.name': 'main-platform',
    // 'multiplayer.platform.id': '{{PLATFORM_ENTITY_ID}}',
  })
  const detectedResources = detectResources({
    detectors: getResourceDetectors(),
  })
  const resource = resourceWithAttributes.merge(detectedResources)

  return resource
}
