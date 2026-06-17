import {
  Fixed64,
  IInstrumentationScope,
  IKeyValue,
  Resource,
} from './otlp-common.type'

export interface IExportTraceServiceRequest {
  resourceSpans?: IResourceSpans[];
}

export interface IResourceSpans {
  resource?: Resource;

  scopeSpans: IScopeSpans[];

  schemaUrl?: string;
}

export interface IScopeSpans {
  scope?: IInstrumentationScope;

  spans?: ISpan[];

  schemaUrl?: string | null;
}

export interface ISpan {
  traceId: string | Uint8Array;

  spanId: string | Uint8Array;

  traceState?: string | null;

  parentSpanId?: string | Uint8Array;

  name: string;

  kind: ESpanKind;

  startTimeUnixNano: Fixed64;

  endTimeUnixNano: Fixed64;

  startTime?: [number, number];

  endTime?: [number, number];

  attributes: IKeyValue[];

  droppedAttributesCount?: number;

  events: IEvent[];

  droppedEventsCount?: number;

  links?: ILink[];

  droppedLinksCount?: number;

  status: IStatus;
}

export enum ESpanKind {
  SPAN_KIND_UNSPECIFIED = 0,

  SPAN_KIND_INTERNAL = 1,

  SPAN_KIND_SERVER = 2,

  SPAN_KIND_CLIENT = 3,

  SPAN_KIND_PRODUCER = 4,

  SPAN_KIND_CONSUMER = 5,
}

/** Properties of a Status. */
export interface IStatus {
  /** Status message */
  message?: string;

  /** Status code */
  code: EStatusCode;
}

/** StatusCode enum. */
export const enum EStatusCode {
  /** The default status. */
  STATUS_CODE_UNSET = 0,
  /** The Span has been evaluated by an Application developers or Operator to have completed successfully. */
  STATUS_CODE_OK = 1,
  /** The Span contains an error. */
  STATUS_CODE_ERROR = 2,
}

/** Properties of an Event. */
export interface IEvent {
  /** Event timeUnixNano */
  timeUnixNano: Fixed64;
  time?: [number, number];

  /** Event name */
  name: string;

  /** Event attributes */
  attributes: IKeyValue[];

  /** Event droppedAttributesCount */
  droppedAttributesCount?: number;
}

export interface ILink {
  traceId: string | Uint8Array;

  spanId: string | Uint8Array;

  traceState?: string;

  attributes: IKeyValue[];

  droppedAttributesCount?: number;
}