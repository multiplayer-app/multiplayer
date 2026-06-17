import { OtelSpanCh } from '@multiplayer/types'
import {
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_PLATFORM_ID,
  ATTR_MULTIPLAYER_INTEGRATION_ID,
} from '@multiplayer-app/session-recorder-node'
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_HOST,
  SEMATTRS_HTTP_ROUTE,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_MESSAGING_SYSTEM,
  SEMATTRS_MESSAGING_DESTINATION,
  SEMATTRS_DB_SYSTEM,
  SEMATTRS_RPC_SYSTEM,
  SEMATTRS_RPC_SERVICE,
  SEMATTRS_RPC_METHOD,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions'
import * as OtelLib from './otlp.lib'
import {
  ICachedFlow,
  ICachedFlowSequence,
  ESpanKind,
} from '../types'
import { replaceIdInString } from '../helpers'

const generateShortId = OtelLib.getIdGenerator(8)

export const extractSequenceFromSpans = (spans: OtelSpanCh[]): ICachedFlow | undefined => {
  if (!spans?.length) {
    return
  }

  const workspaceId = spans[0].SpanAttributes[ATTR_MULTIPLAYER_WORKSPACE_ID]
  const projectId = spans[0].SpanAttributes[ATTR_MULTIPLAYER_PROJECT_ID]
  const environmentName = spans[0].ResourceAttributes[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]?.toLowerCase()
  const entityPlatformId = spans[0].ResourceAttributes[ATTR_MULTIPLAYER_PLATFORM_ID]
  const integrationId = spans[0].ResourceAttributes[ATTR_MULTIPLAYER_INTEGRATION_ID]

  const flow: ICachedFlow = {
    workspaceId,
    projectId,
    environmentName,
    entityPlatformId,
    integrationId,
    sequence: spans.map(span => {
      const sequence: ICachedFlowSequence = {
        spanId: span.SpanId,
        parentSpanId: span.ParentSpanId,
        componentName: span.ServiceName?.toLowerCase(),
        name: span.SpanName,
        httpHost: span.SpanAttributes[SEMATTRS_HTTP_HOST],
        httpMethod: span.SpanAttributes[SEMATTRS_HTTP_METHOD],
        httpEndpoint: replaceIdInString(span.SpanAttributes[SEMATTRS_HTTP_ROUTE]),
        httpStatus: span.SpanAttributes[SEMATTRS_HTTP_STATUS_CODE],
        externalDependency: OtelLib.getExternalDependencyNameFromSpan(span),
        kind: span.SpanKind,
        messagingSystem: replaceIdInString(span.SpanAttributes[SEMATTRS_MESSAGING_SYSTEM]),
        messagingDestination: replaceIdInString(span.SpanAttributes[SEMATTRS_MESSAGING_DESTINATION]),
        dbSystem: replaceIdInString(span.SpanAttributes[SEMATTRS_DB_SYSTEM]),
        rpcSystem: replaceIdInString(span.SpanAttributes[SEMATTRS_RPC_SYSTEM]),
        rpcService: replaceIdInString(span.SpanAttributes[SEMATTRS_RPC_SERVICE]),
        rpcMethod: replaceIdInString(span.SpanAttributes[SEMATTRS_RPC_METHOD]),
      }

      if (sequence.httpStatus) {
        sequence.httpStatus = Number(sequence.httpStatus)
      }

      return sequence
    }),
  }

  return flow
}

export const sortSequence = (sequence: ICachedFlowSequence[]): ICachedFlowSequence[] => {
  const map = new Map()
  const result: ICachedFlowSequence[] = []

  // Create a map with spanId as the key
  sequence.forEach(item => map.set(item.spanId, item))

  // Helper function to recursively place items and their children in order
  function placeItem(item: ICachedFlowSequence) {
    if (map.has(item.spanId)) {
      result.push(item)
      map.delete(item.spanId)

      // Find and place children
      sequence.forEach(child => {
        if (child.parentSpanId === item.spanId) {
          placeItem(child)
        }
      })
    }
  }

  // Start placing items from the roots (items without a parentSpanId)
  sequence.forEach(item => {
    if (!item.parentSpanId) {
      placeItem(item)
    }
  })

  if (!result.length) {
    return sequence
  }

  return result
}

export const squashSpans = (sequence: ICachedFlowSequence[]): {
  sequence: ICachedFlowSequence[],
  spanIdMapping: Map<string, string>
} => {
  const spanIdMapping = new Map()

  const squashedSequence = sequence.reduce((acc: ICachedFlowSequence[], span: ICachedFlowSequence, index) => {
    const parentSpanIndex = acc.findIndex(_span => _span.componentName === span.componentName)

    if (!acc.length) {
      if (span.externalDependency) {
        if (span.kind === ESpanKind.SPAN_KIND_PRODUCER) {
          const _span = {
            ...span,
            spanId: generateShortId(),
            parentSpanId: span.spanId,
            componentName: span.externalDependency,
          }

          sequence.forEach((__span, _index) => {
            if (_index > index && __span.parentSpanId === span.spanId) {
              __span.parentSpanId = _span.spanId
            }
          })

          acc.push(span)
          acc.push(_span)
        } else {
          const _span = {
            ...span,
            componentName: span.externalDependency,
          }

          span.parentSpanId = _span.spanId
          span.spanId = generateShortId()

          sequence.forEach((__span, _index) => {
            if (_index > index && __span.parentSpanId === _span.spanId) {
              __span.parentSpanId = span.spanId
            }
          })
          acc.push(_span)
          acc.push(span)
        }
      } else {
        acc.push(span)
      }
    } else if (span.externalDependency) {
      if (span.kind === ESpanKind.SPAN_KIND_PRODUCER) {
        const _span = {
          ...span,
          spanId: generateShortId(),
          parentSpanId: span.spanId,
          componentName: span.externalDependency,
        }

        sequence.forEach((__span, _index) => {
          if (_index > index && __span.parentSpanId === span.spanId) {
            __span.parentSpanId = _span.spanId
          }
        })

        acc.push(span)
        acc.push(_span)
      } else if (span.kind === ESpanKind.SPAN_KIND_CONSUMER) {
        const _span = {
          ...span,
          componentName: span.externalDependency,
        }

        span.parentSpanId = _span.spanId
        span.spanId = generateShortId()

        sequence.forEach((__span, _index) => {
          if (_index > index && __span.parentSpanId === _span.spanId) {
            __span.parentSpanId = span.spanId
          }
        })
        acc.push(_span)
        acc.push(span)
      } else {
        acc.push({
          ...span,
          componentName: span.externalDependency,
        })
      }
    } else if (
      parentSpanIndex > -1
      && acc[parentSpanIndex].kind !== ESpanKind.SPAN_KIND_INTERNAL
      && span.kind === ESpanKind.SPAN_KIND_INTERNAL
    ) {
      spanIdMapping.set(span.spanId, acc[parentSpanIndex].spanId)
      let squashedHttpEndpoint = false

      if (
        span.httpEndpoint
        && span.httpEndpoint.length > (acc[parentSpanIndex]?.httpEndpoint?.length || 0)
      ) {
        acc[parentSpanIndex].httpEndpoint = span.httpEndpoint
        squashedHttpEndpoint = true
      }

      if (
        span.httpMethod
        && !acc[parentSpanIndex]?.httpMethod
      ) {
        acc[parentSpanIndex].httpMethod = span.httpMethod
        squashedHttpEndpoint = true
      }

    } else if (parentSpanIndex > -1) {
      spanIdMapping.set(span.spanId, acc[parentSpanIndex].spanId)
    } else {
      acc.push(span)
    }

    return acc
  }, [])

  return {
    sequence: squashedSequence,
    spanIdMapping,
  }
}

export const replaceSpanIds = ({ spanIdMapping, sequence }: {
  spanIdMapping: Map<string, string>
  sequence: ICachedFlowSequence[]
}): ICachedFlowSequence[] => {
  const spanShortIdMap = new Map()
  let id = 1

  return sequence.map(_sequence => {
    const mappedSpanId = spanIdMapping.get(_sequence.spanId)
    if (mappedSpanId) {
      _sequence.spanId = mappedSpanId
    }

    if (_sequence.parentSpanId) {
      const mappedParentSpanId = spanIdMapping.get(_sequence.parentSpanId)
      if (mappedParentSpanId) {
        _sequence.parentSpanId = mappedParentSpanId
      }
    }


    let mappedShortSpanId = spanShortIdMap.get(_sequence.spanId)
    if (!mappedShortSpanId) {
      mappedShortSpanId = id
      spanShortIdMap.set(_sequence.spanId, id)
      id++
    }
    _sequence.spanId = mappedShortSpanId


    if (_sequence.parentSpanId) {
      let mappedParentSpanId = spanShortIdMap.get(_sequence.parentSpanId)
      if (!mappedParentSpanId) {
        mappedParentSpanId = id
        spanShortIdMap.set(_sequence.parentSpanId, id)
        id++
      }
      _sequence.parentSpanId = mappedParentSpanId
    }

    return _sequence
  })
}

export const removeUnnecessaryFieldsFromSequence = (sequence: ICachedFlowSequence[]): ICachedFlowSequence[] => {
  return sequence.map(_sequence => {
    // delete _sequence.name
    delete _sequence.externalDependency

    return _sequence
  })
}

export const isSequenceValid = (sequence: ICachedFlowSequence[]): boolean => {
  const rootSpans = sequence.filter(_sequence => !_sequence.parentSpanId)

  if (rootSpans.length !== 1) {
    return false
  }

  return sequence.every(_sequence => {
    if (_sequence.parentSpanId) {
      return sequence.find(__sequence => __sequence.spanId === _sequence.parentSpanId)
    }

    return true
  })
}

export const isSuccessSequence = (sequence: ICachedFlowSequence[]) => {
  return sequence.every(_sequence => {
    if (_sequence.httpStatus) {
      return _sequence.httpStatus >= 200 && _sequence.httpStatus <= 304
    }

    return true
  })
}
