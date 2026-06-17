import { IIssue } from "@multiplayer/types";

export enum ESpanKind {
  SPAN_KIND_UNSPECIFIED = 0,
  SPAN_KIND_INTERNAL = 1,
  SPAN_KIND_SERVER = 2,
  SPAN_KIND_CLIENT = 3,
  SPAN_KIND_PRODUCER = 4,
  SPAN_KIND_CONSUMER = 5,
}

const outgoingSpanKinds = new Set([
  ESpanKind.SPAN_KIND_CLIENT,
  ESpanKind.SPAN_KIND_PRODUCER,
]);

export const getDefaultTitle = (
  title: string,
  metadata: IIssue["metadata"]
): string => {
  const typePrefix = metadata?.type ? `${metadata.type}: ` : "";
  const defaultTitle =
    title ||
    metadata?.message ||
    (outgoingSpanKinds.has(metadata?.spanKind)
      ? "Outgoing request failed"
      : "Incoming request failed");
  return `${typePrefix}${defaultTitle}`;
};
