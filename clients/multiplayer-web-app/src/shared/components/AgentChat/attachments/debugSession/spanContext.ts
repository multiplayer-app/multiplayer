import { OtelScope } from "@multiplayer/types";

import {
  splitUrl,
  formatTime,
} from "pages/Workspace/Project/Debugger/DebugSession/utils";
import {
  DebugSessionNodeType,
  IDebugSessionNode,
  ITraceData,
  ILogData,
  IConsoleNode,
} from "pages/Workspace/Project/Debugger/DebugSession/types";

import type { ContextAttachmentParams } from "@multiplayer-app/ai-agent-react";

import { SPAN_KIND } from "../kinds";

export interface SimpleSpan {
  id: string;
  type: DebugSessionNodeType;
  label: string;
  timestampMs: number;
  relativeTime?: string;
  durationMs?: number;
  hasError?: boolean;
  serviceName?: string;
  scope?: string;
  spanId?: string;
  traceId?: string;
  attributes?: Record<string, string | number | boolean>;
  status?: { code?: string; message?: string };
  body?: string;
  childSpans?: SimpleSpan[];
}

const truncate = (value: string, max = 120) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const getHttpStatusCode = (attrs: Record<string, any> | undefined) =>
  attrs?.["http.status_code"] || attrs?.["http.response.status_code"];

const getHttpPath = (attrs: Record<string, any> | undefined) => {
  const url = attrs?.["http.url"];
  if (!url) return undefined;
  return splitUrl(url)?.path || url;
};

const getTraceLabel = (node: IDebugSessionNode<ITraceData>): string => {
  const trace = node.meta;
  const attrs = trace.SpanAttributes ?? {};

  switch (trace.ScopeName) {
    case OtelScope.http:
    case OtelScope.fetch:
    case OtelScope.httpXmlRequest: {
      const method = attrs["http.method"];
      const path = getHttpPath(attrs);
      const statusCode = getHttpStatusCode(attrs);
      const base = [method, path].filter(Boolean).join(" ");
      return statusCode ? `${base} (${statusCode})` : base || trace.SpanName;
    }
    case OtelScope.navigation: {
      const route =
        attrs["navigation.metadata.friendlyRouteName"] ||
        attrs["navigation.route_name"];
      return route ? `Navigated to ${route}` : "Navigation";
    }
    case OtelScope.exception: {
      const message = trace.StatusMessage;
      return message ? `${trace.SpanName}: ${message}` : trace.SpanName;
    }
    case OtelScope.multiplayerNotebookHttp:
    case OtelScope.documentLoad: {
      const method = attrs["http.method"];
      const path = getHttpPath(attrs);
      const statusCode = getHttpStatusCode(attrs);
      const spanLabel = trace.SpanName.replace(/([A-Z])/g, " $1").trim();
      const base = [spanLabel, method, path].filter(Boolean).join(" ");
      return statusCode ? `${base} (${statusCode})` : base;
    }
    default:
      return trace.SpanName || trace.ServiceName || "Trace span";
  }
};

const getEventLabel = (node: IDebugSessionNode<ITraceData>): string => {
  const attrs = node.meta.SpanAttributes ?? {};
  const gestureType = attrs["gesture.type"];

  if (gestureType) {
    const role = attrs["gesture.target.role"];
    const label = attrs["gesture.target.label"];
    const gestureName =
      gestureType === "tap"
        ? "Tapped"
        : String(gestureType).charAt(0).toUpperCase() +
          String(gestureType).slice(1);

    if (role === "text" && label) {
      return `${gestureName} on "${label}"`;
    }
    return gestureName;
  }

  if (attrs["target.innerText"]) {
    return `Clicked on "${attrs["target.innerText"]}"`;
  }

  if (attrs["target_element"]) {
    return `Clicked on ${String(
      attrs["target_element"]
    ).toLowerCase()} element`;
  }

  return "User interaction";
};

const getLogLabel = (node: IDebugSessionNode<ILogData>): string => {
  const { ServiceName, SeverityText, Body } = node.meta;
  const body = truncate(Body || "", 80);
  return [ServiceName, SeverityText, body].filter(Boolean).join(": ");
};

const getConsoleLabel = (node: IDebugSessionNode<IConsoleNode>): string => {
  const message = node.meta.message || "Console output";
  return truncate(message, 100);
};

export const getSpanName = (node: IDebugSessionNode<any>): string => {
  switch (node.type) {
    case DebugSessionNodeType.Trace:
      return truncate(getTraceLabel(node), 60);
    case DebugSessionNodeType.Event:
      return truncate(getEventLabel(node), 60);
    case DebugSessionNodeType.Log:
      return truncate(getLogLabel(node), 60);
    case DebugSessionNodeType.Console:
      return truncate(getConsoleLabel(node), 60);
    default:
      return "Debug session span";
  }
};

const pickTraceAttributes = (
  node: IDebugSessionNode<ITraceData>
): Record<string, string | number | boolean> | undefined => {
  const trace = node.meta;
  const attrs = trace.SpanAttributes ?? {};
  const picked: Record<string, string | number | boolean> = {};

  const method = attrs["http.method"];
  const path = getHttpPath(attrs);
  const statusCode = getHttpStatusCode(attrs);
  const route =
    attrs["navigation.metadata.friendlyRouteName"] ||
    attrs["navigation.route_name"];

  if (method) picked.httpMethod = method;
  if (path) picked.httpPath = path;
  if (statusCode) picked.httpStatusCode = statusCode;
  if (route) picked.route = route;
  if (attrs["target.innerText"]) picked.targetText = attrs["target.innerText"];
  if (attrs["target_element"]) picked.targetElement = attrs["target_element"];
  if (attrs["gesture.type"]) picked.gestureType = attrs["gesture.type"];
  if (attrs["gesture.target.label"]) {
    picked.gestureLabel = attrs["gesture.target.label"];
  }

  return Object.keys(picked).length ? picked : undefined;
};

export const simplifySpan = (
  node: IDebugSessionNode<any>,
  sessionStartMs?: number
): SimpleSpan => {
  const durationMs =
    typeof node.duration === "number" && node.duration >= 0
      ? Math.round(node.duration / 1_000_000)
      : undefined;

  const base: SimpleSpan = {
    id: node.id,
    type: node.type,
    label: getSpanName(node),
    timestampMs: node.timestamp,
    relativeTime:
      sessionStartMs !== undefined
        ? formatTime(node.timestamp - sessionStartMs)
        : undefined,
    durationMs,
    hasError: node.hasError,
    childSpans: (node.childSpans ?? []).map((child) =>
      simplifySpan(child, sessionStartMs)
    ),
  };

  switch (node.type) {
    case DebugSessionNodeType.Trace:
    case DebugSessionNodeType.Event: {
      const trace = node.meta as ITraceData;
      return {
        ...base,
        serviceName: trace.ServiceName,
        scope: trace.ScopeName,
        spanId: trace.SpanId,
        traceId: trace.TraceId,
        attributes: pickTraceAttributes(node),
        status: trace.StatusCode
          ? { code: trace.StatusCode, message: trace.StatusMessage }
          : undefined,
      };
    }
    case DebugSessionNodeType.Log: {
      const log = node.meta as ILogData;
      return {
        ...base,
        serviceName: log.ServiceName,
        spanId: log.SpanId,
        traceId: log.TraceId,
        body: truncate(log.Body || "", 500),
        attributes: log.SeverityText
          ? { severity: log.SeverityText }
          : undefined,
      };
    }
    case DebugSessionNodeType.Console: {
      const consoleNode = node.meta as IConsoleNode;
      return {
        ...base,
        body: truncate(consoleNode.message || "", 500),
        attributes: consoleNode.data?.payload?.level
          ? { level: consoleNode.data.payload.level }
          : undefined,
      };
    }
    default:
      return base;
  }
};

export const SPAN_ATTACHMENT_SUMMARY =
  "Simplified debug session span(s) with nested child spans where applicable. Use the spans array to analyze errors, requests, navigation, logs, or user actions at these points in the recording.";

export interface SpanAttachmentEntry {
  nodeId: string;
  spanId?: string;
  traceId?: string;
  span: SimpleSpan;
}

export interface SpanAttachmentData extends Record<string, unknown> {
  debugSessionId: string;
  debugSessionName?: string;
  debugSessionUrl?: string;
  spans: SpanAttachmentEntry[];
}

export const buildSpanEntry = (
  node: IDebugSessionNode<any>,
  sessionStartMs?: number
): SpanAttachmentEntry => {
  const span = simplifySpan(node, sessionStartMs);

  return {
    nodeId: node.id,
    spanId: span.spanId,
    traceId: span.traceId,
    span,
  };
};

export const buildSpanData = ({
  debugSessionId,
  debugSessionName,
  debugSessionUrl,
  nodes,
  node,
  sessionStartMs,
}: {
  debugSessionId: string;
  debugSessionName?: string;
  debugSessionUrl?: string;
  nodes?: IDebugSessionNode<any>[];
  node?: IDebugSessionNode<any>;
  sessionStartMs?: number;
}): SpanAttachmentData => {
  const resolvedNodes = nodes ?? (node ? [node] : []);
  const spans = resolvedNodes.map((entry) =>
    buildSpanEntry(entry, sessionStartMs)
  );

  return {
    debugSessionId,
    debugSessionName,
    debugSessionUrl,
    spans,
  };
};

const getSpanAttachmentName = (nodes: IDebugSessionNode<any>[]) => {
  if (nodes.length === 0) return "Debug session spans";
  if (nodes.length === 1) return getSpanName(nodes[0]);
  return `${nodes.length} spans`;
};

export const buildSpanContext = ({
  debugSessionId,
  debugSessionName,
  debugSessionUrl,
  nodes,
  node,
  sessionStartMs,
}: {
  debugSessionId: string;
  debugSessionName?: string;
  debugSessionUrl?: string;
  nodes?: IDebugSessionNode<any>[];
  node?: IDebugSessionNode<any>;
  sessionStartMs?: number;
}): ContextAttachmentParams => {
  const resolvedNodes = nodes ?? (node ? [node] : []);
  const name = getSpanAttachmentName(resolvedNodes);

  return {
    kind: SPAN_KIND,
    name,
    title: name,
    summary: SPAN_ATTACHMENT_SUMMARY,
    url: debugSessionUrl,
    data: buildSpanData({
      debugSessionId,
      debugSessionName,
      debugSessionUrl,
      nodes: resolvedNodes,
      sessionStartMs,
    }),
  };
};
