import { v4 as uuidv4 } from "uuid";
import { EventType, eventWithTime } from "@rrweb/types";
import { Replayer } from "rrweb";
import type { LogData } from "@rrweb/rrweb-plugin-console-record";
import {
  ITraceData,
  IDebugSessionNode,
  DebugSessionNodeType,
  ITraceNode,
} from "./types";
import { clone, parseDate } from "shared/utils";
import { MISSING_SPAN_NAME } from "shared/configs/project";
import { httpStatusCodes } from "shared/configs/openApi.configs";
import { OtelScope } from "@multiplayer/types";

export function newDebugSessionNode<T>(
  type: DebugSessionNodeType,
  meta
): IDebugSessionNode<T> {
  let timestamp = 0;
  let duration = -1;
  let childSpans = [];
  let id = meta.id || uuidv4();

  switch (type) {
    case DebugSessionNodeType.Trace:
      timestamp = parseDate(meta.Timestamp);
      duration = Number(meta.Duration);
      break;
    case DebugSessionNodeType.Event:
      timestamp = parseDate(meta.Timestamp);
      break;
    case DebugSessionNodeType.Log:
      timestamp = parseDate(meta.Timestamp);
      break;
    case DebugSessionNodeType.Console:
      meta.message = getConsoleMessage(meta.data.payload);
      timestamp = meta.timestamp;
      break;
    default:
      break;
  }

  return { id, type, meta, timestamp, childSpans, duration };
}

export function getConsoleMessage(data: LogData) {
  const { level = "log", payload = [] } = data || {};
  const [message = `console.${level}`] = payload;
  const slicedMessage = message.slice(0, 60);
  return (
    slicedMessage.length < message.length
      ? `${slicedMessage}...`
      : slicedMessage
  ).replace(/\\n/g, "\n");
}

export function buildTraceTree(
  traces: IDebugSessionNode<ITraceData>[]
): IDebugSessionNode<ITraceData>[] {
  const isErrorStatusCode = (statusCode?: string): boolean =>
    statusCode?.toUpperCase() === "ERROR";

  const tree: IDebugSessionNode<ITraceData>[] = [];
  const traceMap: { [key: string]: IDebugSessionNode<ITraceData> } = {};
  const rootsByTraceId: { [key: string]: IDebugSessionNode<ITraceData> } = {};

  traces.forEach((node) => {
    traceMap[node.meta.SpanId] = {
      ...node,
      childSpans: [],
      hasError: isErrorStatusCode(node.meta.StatusCode),
    };
  });

  traces.forEach((node) => {
    if (!node.meta.ParentSpanId) {
      rootsByTraceId[node.meta.TraceId] = traceMap[node.meta.SpanId];
    }
  });

  traces.forEach((node) => {
    const { SpanId, ParentSpanId } = node.meta;
    const currentNode = traceMap[SpanId];

    if (ParentSpanId) {
      const parent = traceMap[ParentSpanId];
      if (parent) {
        parent.childSpans.push(currentNode);
      } else {
        const rootForTrace = rootsByTraceId[node.meta.TraceId];
        if (rootForTrace) {
          rootForTrace.childSpans.push(currentNode);
        } else {
          tree.push(currentNode);
        }
      }
    } else {
      tree.push(currentNode);
    }
  });

  const markNodeAndParentErrorState = (
    node: IDebugSessionNode<ITraceData>
  ): boolean => {
    const childHasError = (node.childSpans || []).some((child) =>
      markNodeAndParentErrorState(child)
    );
    node.hasError = Boolean(node.hasError) || childHasError;
    return node.hasError;
  };

  tree.forEach(markNodeAndParentErrorState);

  return tree;
}

export const injectTracesToTree = (
  traceTree: IDebugSessionNode<ITraceData>[],
  traces: IDebugSessionNode<ITraceData>[]
): {
  tree: IDebugSessionNode<ITraceData>[];
  missingTraces: IDebugSessionNode<ITraceData>[];
} => {
  const traceMap: { [key: string]: IDebugSessionNode<ITraceData> } = {};
  const traceTreeMap: { [key: string]: IDebugSessionNode<ITraceData> } = {};
  const missingTraces: IDebugSessionNode<ITraceData>[] = [];
  // Build a map of all existing nodes in the tree (including nested children)
  const buildTreeMap = (nodes: IDebugSessionNode<ITraceData>[]) => {
    nodes.forEach((node) => {
      traceTreeMap[node.meta.SpanId] = node;
      if (node.childSpans && node.childSpans.length > 0) {
        buildTreeMap(node.childSpans);
      }
    });
  };

  buildTreeMap(traceTree);

  // Process new traces
  traces.forEach((node) => {
    const { SpanId, ParentSpanId } = node.meta;
    const currentNode = { ...node, childSpans: [] };
    traceMap[SpanId] = currentNode;

    if (ParentSpanId) {
      const parent = traceTreeMap[ParentSpanId];
      if (parent) {
        // Parent exists in the tree, add as child
        parent.childSpans.push(currentNode);
      } else {
        // Parent doesn't exist, add to root level
        missingTraces.push(currentNode);
      }
    } else {
      // No parent, add to root level
      traceTree.push(currentNode);
    }
  });

  return {
    tree: traceTree,
    missingTraces,
  };
};

const generateEmptyParent = (
  missingSpanId: string,
  firstChildNode: IDebugSessionNode<ITraceData>
): IDebugSessionNode<any> => ({
  timestamp: firstChildNode.timestamp,
  type: DebugSessionNodeType.Trace,
  meta: {
    SpanName: MISSING_SPAN_NAME,
    ServiceName: MISSING_SPAN_NAME,
    ScopeName: firstChildNode.meta.ScopeName,
    SpanId: missingSpanId,
    TraceId: firstChildNode.meta.TraceId,
    SpanAttributes: null,
    ResourceAttributes: {},
    Duration: -1,
  },
  childSpans: [firstChildNode],
  id: missingSpanId,
  duration: -1,
});

function padZero(num: number, len = 2): string {
  let str = String(num);
  const threshold = Math.pow(10, len - 1);
  if (num < threshold) {
    while (String(threshold).length > str.length) {
      str = `0${num}`;
    }
  }
  return str;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export function formatTime(ms: number): string {
  if (ms <= 0) {
    return "00:00";
  }
  const hour = Math.floor(ms / HOUR);
  ms = ms % HOUR;
  const minute = Math.floor(ms / MINUTE);
  ms = ms % MINUTE;
  const second = Math.floor(ms / SECOND);
  if (hour) {
    return `${padZero(hour)}:${padZero(minute)}:${padZero(second)}`;
  }
  return `${padZero(minute)}:${padZero(second)}`;
}

export function getFormattedTime(start: any = 0, current: any = 0): string {
  const startTime =
    typeof start === "string" || start instanceof Date
      ? parseDate(start)
      : start;
  const currentTime =
    typeof current === "string" || current instanceof Date
      ? parseDate(current)
      : current;

  return formatTime(currentTime - startTime);
}

export const getReplayerContext = (replayer: Replayer) => {
  const { context } = replayer.service.state;
  const totalEvents = context.events.length;
  const start = context.events[0].timestamp;
  const end = context.events[totalEvents - 1].timestamp;
  return { start, end, events: context.events };
};

export const getPosition = (
  startTime: number,
  endTime: number,
  tagTime: number
) => {
  const sessionDuration = endTime - startTime;
  const eventDuration = endTime - tagTime;
  const eventPosition = Math.max(
    100 - (eventDuration / sessionDuration) * 100,
    0
  );
  return eventPosition.toFixed(2);
};

export const getWidth = (
  startTime: number,
  endTime: number,
  tagStart: number,
  tagEnd: number
) => {
  const eventDuration = tagEnd - tagStart;
  const sessionDuration = endTime - startTime;
  const width = (eventDuration / sessionDuration) * 100;
  return width.toFixed(2);
};

export function splitUrl(url) {
  if (!url) return {};
  const regex = /^(https?:\/\/[^\/]+)(\/[^?]*)(\?.+)?$/;
  const matches = url.match(regex);

  if (matches) {
    const origin = matches[1];
    const path = matches[2];
    const query = matches[3] || "";

    return { origin, path, query };
  } else {
    return {};
  }
}

export const formatDuration = (duration: number, toFixed = 2) => {
  if (duration < 1000) {
    return `${duration.toFixed(0)}ns`;
  } else if (duration < 1000000) {
    return `${(duration / 1000).toFixed(0)}μs`;
  } else if (duration < 1000000000) {
    return `${(duration / 1000000).toFixed(0)}ms`;
  } else {
    return `${(duration / 1000000000).toFixed(toFixed)}s`;
  }
};

export const isConsoleEvent = (event) => {
  return (
    event.type === EventType.Plugin &&
    event.data.plugin === "rrweb/console@1" &&
    event.data.payload
  );
};

/** Per-second + payload fingerprint for console sampling. */
export function consoleDedupeKey(
  timestamp: number,
  payload: LogData
): string;
export function consoleDedupeKey(event: eventWithTime): string | null;
export function consoleDedupeKey(
  a: number | eventWithTime,
  b?: LogData
): string | null {
  if (typeof a === "number") {
    if (b === undefined) return null;
    const second = Math.floor(a / 1000);
    return `${second}\0${JSON.stringify(b)}`;
  }
  if (!isConsoleEvent(a)) return null;
  return consoleDedupeKey(
    a.timestamp,
    (a.data as { payload: LogData }).payload
  );
}

/** First event per (recording second, payload); drops repeats. */
export function dedupeConsoleEvents(events: eventWithTime[]): eventWithTime[] {
  const seen = new Set<string>();
  const out: eventWithTime[] = [];
  for (const event of events) {
    const key = consoleDedupeKey(event);
    if (key === null) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }
  return out;
}

export const isUserInteractionEvent = (trace: ITraceData) => {
  return trace.ScopeName === OtelScope.userInteraction;
};

export const getKeysWithTrueValue = (map: Map<string, boolean>): string[] => {
  return Array.from(map.entries())
    .filter(([key, value]) => value === true)
    .map(([key, value]) => key);
};

export function determineParentState<T>(
  node: IDebugSessionNode<T>,
  checkedNodes: Map<string, boolean>
): "checked" | "indeterminate" | "unchecked" {
  if (!node.childSpans || node.childSpans.length === 0)
    return checkedNodes.get(node.id) || false ? "checked" : "unchecked";

  let allChecked = true;
  let someChecked = false;

  for (const child of node.childSpans) {
    const childState = determineParentState(child, checkedNodes);
    if (childState === "unchecked") {
      allChecked = false;
    } else {
      someChecked = true;
    }

    if (childState === "indeterminate") {
      allChecked = false;
      someChecked = true;
    }
  }

  if (allChecked) {
    return "checked";
  } else if (someChecked) {
    return "indeterminate";
  } else {
    return "unchecked";
  }
}

/** Checked nodes excluding descendants of another checked ancestor. */
export function collectTopmostCheckedNodes<T>(
  roots: IDebugSessionNode<T>[],
  checkedNodes: Map<string, boolean>
): IDebugSessionNode<T>[] {
  const result: IDebugSessionNode<T>[] = [];

  const visit = (node: IDebugSessionNode<T>, ancestorChecked: boolean) => {
    const selfChecked = checkedNodes.get(node.id) === true;

    if (selfChecked && !ancestorChecked) {
      result.push(node);
      return;
    }

    node.childSpans?.forEach((child) =>
      visit(child, selfChecked || ancestorChecked)
    );
  };

  roots.forEach((root) => visit(root, false));
  return result;
}

export function getCheckedAndIndeterminateIds<T>(
  nodes: IDebugSessionNode<T>[],
  checkedState: Map<string, boolean>
): string[] {
  const ids: string[] = [];

  const collectIds = (currentNode: IDebugSessionNode<T>) => {
    const parentState = determineParentState(currentNode, checkedState);
    if (parentState === "checked" || parentState === "indeterminate") {
      ids.push(currentNode.id);
    }

    if (currentNode.childSpans) {
      currentNode.childSpans.forEach(collectIds);
    }
  };

  // Iterate over each root node in the array
  nodes.forEach((node) => collectIds(node));

  return ids;
}

export function filterNodesByIdSet<T>(
  nodes: IDebugSessionNode<T>[],
  idSet: Set<string>
): IDebugSessionNode<T>[] {
  const filterNode = (
    node: IDebugSessionNode<T>
  ): IDebugSessionNode<T> | null => {
    if (idSet.has(node.id)) {
      return {
        ...node,
        childSpans: node.childSpans
          ? node.childSpans.map(filterNode).filter((child) => child !== null) // Recursively filter children
          : undefined,
      };
    }
    return null;
  };

  // Filter the root nodes
  return nodes
    .map(filterNode)
    .filter((node) => node !== null) as IDebugSessionNode<T>[];
}

export const getNodeStatus = (node: IDebugSessionNode<any>) => {
  const { SpanAttributes } = node.meta || {};
  if (!SpanAttributes) {
    return;
  }
  const statusCode = SpanAttributes["http.status_code"];

  if (!statusCode) {
    return;
  }

  const statusText =
    SpanAttributes["http.status_text"] ||
    httpStatusCodes[statusCode]?.toUpperCase();

  return { statusText, statusCode };
};

export const isHttpError = (code: number): boolean => {
  if (!code) {
    return false;
  }
  return code >= 400 && code < 600;
};

export const isExceptionNode = (node: IDebugSessionNode<any>): boolean => {
  switch (node.type) {
    case DebugSessionNodeType.Trace:
      return isHttpError(node.meta?.SpanAttributes?.["http.status_code"]);
    case DebugSessionNodeType.Console:
      return node.meta?.data?.payload?.level === "error";
    case DebugSessionNodeType.Event:
      return node.meta?.name === "exception";
    case DebugSessionNodeType.Log:
      return node.meta?.SeverityText === "error";
    default:
      return false;
  }
};

export const isErrorLog = (log: any): boolean => {
  if (!log) {
    return false;
  }
  const severityText = log.SeverityText || "";
  return (
    severityText.toLowerCase() === "error" ||
    severityText.toLowerCase() === "warn"
  );
};

export const isMostRelevantNode = (
  node: IDebugSessionNode<any>,
  starredNodes: Set<string>
): boolean => {
  if (starredNodes.has(node.id)) {
    return true;
  }

  switch (node.type) {
    case DebugSessionNodeType.Trace:
      const isLongTrace = node.duration > 2000000000; //2sec
      return (
        isHttpError(node.meta?.SpanAttributes?.["http.status_code"]) ||
        isLongTrace
      );
    case DebugSessionNodeType.Console:
      return node.meta?.data?.payload?.level === "error";
    case DebugSessionNodeType.Event:
      return node.meta?.name === "exception";
    case DebugSessionNodeType.Log:
      return isErrorLog(node.meta);
    default:
      return false;
  }
};

export const isMostRelevantChildNode = (
  node: IDebugSessionNode<any>,
  starredNodes: Set<string>
): boolean => {
  if (starredNodes.has(node.id)) {
    return true;
  }

  const { SpanAttributes } = node.meta || {};

  return !!SpanAttributes?.["http.method"] || !!SpanAttributes?.["db.system"];
};

export const nodeMatchesComponent = (
  node: IDebugSessionNode<ITraceNode>,
  componentFilterSet: Set<any>
): boolean => {
  const { ServiceName, SpanAttributes } = node.meta || {};

  return (
    componentFilterSet.has(SpanAttributes?.["db.system"]) ||
    componentFilterSet.has(ServiceName)
  );
};

export const filterNodeTreeWithMatchingDescendants = (
  node: IDebugSessionNode<any>,
  componentFilterSet: Set<any>
): IDebugSessionNode<any> | null => {
  const filteredChildren = node.childSpans
    ?.map((child) =>
      filterNodeTreeWithMatchingDescendants(child, componentFilterSet)
    )
    .filter(Boolean) as IDebugSessionNode<ITraceNode>[];

  const hasMatchingChildren = filteredChildren.length > 0;
  const matchesSelf = nodeMatchesComponent(node, componentFilterSet);

  if (!matchesSelf && !hasMatchingChildren) {
    return null;
  }

  return {
    ...node,
    childSpans: filteredChildren,
  };
};

const attrIncludesQuery = (
  obj: Record<string, any> | undefined,
  query: string
): boolean =>
  !!obj &&
  Object.values(obj).some((val) => String(val).toLowerCase().includes(query));

export const doesNodeMatchQuery = (
  n: IDebugSessionNode<any>,
  query: string
): boolean => {
  switch (n.type) {
    case DebugSessionNodeType.Trace:
      const data = n.meta.SpanAttributes || {};
      const method = data["http.method"];
      const statusCode = data["http.status_code"];
      const statusText =
        data["http.status_text"] || httpStatusCodes[statusCode]?.toUpperCase();
      const path = splitUrl(data["http.url"])?.path || data["http.url"];

      return (
        n.meta.SpanName?.toLowerCase().includes(query) ||
        n.meta.ServiceName?.toLowerCase().includes(query) ||
        n.meta.TraceId?.toLowerCase().includes(query) ||
        statusCode?.toLowerCase().includes(query) ||
        statusText?.toLowerCase().includes(query) ||
        method?.toLowerCase().includes(query) ||
        path?.toLowerCase().includes(query) ||
        attrIncludesQuery(n.meta.SpanAttributes, query) ||
        attrIncludesQuery(n.meta.ResourceAttributes, query)
      );
    case DebugSessionNodeType.Log:
      return (
        n.meta.Body?.toLowerCase().includes(query) ||
        n.meta.ServiceName?.toLowerCase().includes(query) ||
        n.meta.SeverityText?.toLowerCase().includes(query) ||
        attrIncludesQuery(n.meta.SpanAttributes, query) ||
        attrIncludesQuery(n.meta.ResourceAttributes, query)
      );
    case DebugSessionNodeType.Event:
      return (
        n.meta.SpanAttributes?.target?.innerText
          .toLowerCase()
          .includes(query) ||
        n.meta.SpanName?.toLowerCase().includes(query) ||
        attrIncludesQuery(n.meta.SpanAttributes, query) ||
        attrIncludesQuery(n.meta.ResourceAttributes, query)
      );
    case DebugSessionNodeType.Console:
      return (
        n.meta?.message?.toLowerCase().includes(query) ||
        attrIncludesQuery(n.meta.SpanAttributes, query) ||
        attrIncludesQuery(n.meta.ResourceAttributes, query)
      );
    default:
      return false;
  }
};

export const filterNodeTreeWithMostRelevant = (
  node: IDebugSessionNode<any>,
  starredNodes: Set<string>
): IDebugSessionNode<any> | null => {
  const isRelevant = isMostRelevantNode(node, starredNodes);
  const filteredChildren = node.childSpans
    ? (node.childSpans
        .filter((child) => isMostRelevantChildNode(child, starredNodes))
        .map((n) => filterNodeTreeWithMostRelevant(n, starredNodes))
        .filter(Boolean) as IDebugSessionNode<any>[])
    : [];

  if (isRelevant || filteredChildren.length > 0) {
    return {
      ...node,
      childSpans: isRelevant ? node.childSpans : filteredChildren,
    };
  }
  return null;
};

export const collectAllSessionNodes = (
  nodes: IDebugSessionNode<any>[]
): IDebugSessionNode<any>[] => {
  const allNodes = clone(nodes) as IDebugSessionNode<any>[];
  const traceMap = new Map<string, IDebugSessionNode<any>[]>();
  const { traces, logs, otherNodes } = allNodes.reduce<{
    traces: IDebugSessionNode<any>[];
    logs: IDebugSessionNode<any>[];
    otherNodes: IDebugSessionNode<any>[];
  }>(
    (acc, node) => {
      if (node.type === DebugSessionNodeType.Trace) {
        acc.traces.push(node);
        const traceId = node.meta.TraceId;
        if (!traceMap.has(traceId)) {
          traceMap.set(traceId, []);
        }
        traceMap.get(traceId)!.push(node);
      } else if (node.type === DebugSessionNodeType.Log) {
        acc.logs.push(node);
      } else {
        acc.otherNodes.push(node);
      }
      return acc;
    },
    { traces: [], logs: [], otherNodes: [] }
  );

  logs.forEach((log) => {
    const traceId = log.meta.TraceId;
    if (traceMap.has(traceId)) {
      const tracesWithSameTraceId = traceMap.get(traceId)!;

      const traceWithoutParentSpanId = tracesWithSameTraceId.filter(
        (trace) => !trace.meta.ParentSpanId
      );

      const targetTrace =
        traceWithoutParentSpanId?.[0] || tracesWithSameTraceId?.[0];

      if (targetTrace) {
        if (targetTrace.childSpans) {
          targetTrace.childSpans.push(log);
        } else {
          targetTrace.childSpans = [log];
        }
      } else {
        otherNodes.push(log);
      }
    } else {
      otherNodes.push(log);
    }
  });

  const result = [...traces, ...otherNodes].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  return result;
};
