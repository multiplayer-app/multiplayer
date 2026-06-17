import { DebugSessionNodeType, IDebugSessionNode, ITraceData } from './interfaces'


export const buildTraceTree = (
  traces: IDebugSessionNode<ITraceData>[],
): IDebugSessionNode<ITraceData>[] => {
  const traceMap: { [key: string]: IDebugSessionNode<ITraceData> } = {}

  traces.forEach((node) => {
    traceMap[node.meta.SpanId] = { ...node, childSpans: [] }
  })

  const tree: IDebugSessionNode<ITraceData>[] = []

  traces.forEach((node) => {
    const { SpanId, ParentSpanId } = node.meta
    const currentNode = traceMap[SpanId]

    if (ParentSpanId) {
      const parent = traceMap[ParentSpanId]
      if (parent) {
        parent.childSpans?.push(currentNode)
      } else {
        traceMap[ParentSpanId] = generateEmptyParent(ParentSpanId, currentNode)
        tree.push(traceMap[ParentSpanId])
      }
    } else {
      tree.push(currentNode)
    }
  })

  return tree
}

const generateEmptyParent = (
  spanId: string,
  firstChildNode: IDebugSessionNode<ITraceData>,
): IDebugSessionNode<any> => ({
  timestamp: firstChildNode.timestamp,
  type: DebugSessionNodeType.Trace,
  meta: {
    SpanName: 'Missing Span',
    ServiceName: 'Missing Span',
    ScopeName: firstChildNode.meta.ScopeName,
    SpanId: spanId,
    SpanAttributes: null,
    ResourceAttributes: {},
    Duration: -1,
  },
  childSpans: [firstChildNode],
  id: '',
  duration: -1,
})


export function newDebugSessionNode<T>(
  type: DebugSessionNodeType,
  meta: any,
): IDebugSessionNode<T> {
  let timestamp = 0
  let duration = -1
  const childSpans: any[] = []
  const id = meta.id || ''

  switch (type) {
    case DebugSessionNodeType.Trace:
      timestamp = parseDate(meta.Timestamp)
      duration = Number(meta.Duration)
      break
    case DebugSessionNodeType.Event:
      timestamp = parseDate(meta.Timestamp)
      break
    case DebugSessionNodeType.Console:
      timestamp = meta.timestamp
      break
    case DebugSessionNodeType.Log:
      timestamp = parseDate(meta.Timestamp)
      break
    default:
      break
  }

  return { id, type, meta, timestamp, childSpans, duration }
}


export function parseDate(dateStr: any): number {
  if (!dateStr) return Date.now()
  // Handle format: 2024-07-25 11:42:37.622000000
  if (dateStr.includes(' ')) {
    return new Date(dateStr.replace(' ', 'T') + 'Z').getTime()
  }
  // Handle format: 2024-07-25T11:42:07.777Z
  return new Date(dateStr).getTime()
}


export function minimizeNodeData(node: IDebugSessionNode<any>): any {
  const baseNode = {
    id: node.id,
    type: node.type,
    timestamp: node.timestamp,
    duration: node.duration,
  }

  if (node.type === DebugSessionNodeType.Log) {
    return {
      ...baseNode,
      SpanName: node.meta.SpanName,
      SpanKind: node.meta.SpanKind,
      ServiceName: node.meta.ServiceName,
      SeverityText: node.meta.SeverityText,
      LogAttributes: node.meta.LogAttributes,
    }
  }
  if (node.type === DebugSessionNodeType.Event) {
    return {
      ...baseNode,
      SpanName: node.meta.SpanName,
      SpanKind: node.meta.SpanKind,
      ServiceName: node.meta.ServiceName,
      name: node.meta.name,
      SpanAttributes: node.meta.SpanAttributes,
    }
  }
  if (node.type === DebugSessionNodeType.Trace) {
    return {
      ...baseNode,
      SpanName: node.meta.SpanName,
      SpanKind: node.meta.SpanKind,
      ServiceName: node.meta.ServiceName,
      SpanAttributes: node.meta.SpanAttributes,
      childSpans: (node.childSpans || []).map((child) => minimizeNodeData(child)),
    }
  }
  if (node.type === DebugSessionNodeType.Console) {
    return {
      ...baseNode,
      name: node.meta?.name,
      data: node.meta?.data,
    }
  }
  return node
}
