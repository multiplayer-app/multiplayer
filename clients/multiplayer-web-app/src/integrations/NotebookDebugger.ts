import { ReadableSpan } from "@opentelemetry/sdk-trace-base";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { Observable } from "lib0/observable";
import {
  ATTR_MULTIPLAYER_SESSION_ID,
  SessionRecorderIdGenerator,
  SessionRecorderBrowserTraceExporter,
} from '@multiplayer-app/session-recorder-react';
import { IDebugSession } from "@multiplayer/types";
import { getTemporaryApiKey } from "../shared/services/notebook.service";
import {
  startDebugSession,
  stopDebugSession,
} from "../shared/services/radar.service";
import { Notebook } from "@multiplayer/types";
import { config } from "../config";


export enum DEBUG_HEADERS {
  TRACEPARENT = "traceparent",
  TRACESTATE = "tracestate",
  SPAN_ID = "x-span-id",
  TRACE_ID = "x-trace-id",
}

type EditableSpan = { -readonly [P in keyof ReadableSpan]: ReadableSpan[P] };

type NotebookDebuggerSpanEvent = {
  name: string;
  attributes: Record<string, string>;
};

export enum NotebookDebuggerEvents {
  START = "start",
  STOP = "stop",
  ERROR = "error",
}

const SESSION_STORAGE_KEY = "notebook_debugger_sessions";

export class NotebookDebugger
  extends Observable<NotebookDebuggerEvents>
  implements Notebook.IMultiplayerDebugger {
  public readonly userName: string;
  public readonly userId: string;
  private readonly entityId: string;
  private readonly projectId: string;
  private readonly workspaceId: string;
  private readonly resource: ReadableSpan["resource"];

  private exporter: SessionRecorderBrowserTraceExporter;
  private apiKey: string;
  private debugSession: IDebugSession;
  public traceId: string;
  private idGenerator: SessionRecorderIdGenerator;
  private spansToExport: Record<string, EditableSpan> = {};
  private lastActivityTime: number;
  private idleTimer: NodeJS.Timeout | null = null;

  private get _sessionKey(): string {
    return `${this.workspaceId}_${this.projectId}_${this.entityId}`;
  }

  constructor(params: {
    resourceName: string;
    workspaceId: string;
    projectId: string;
    entityId: string;
    userId: string;
    userName: string;
  }) {
    super();
    this.resource = resourceFromAttributes({
      'service.name': params.resourceName,
    });
    this.idGenerator = new SessionRecorderIdGenerator();

    this.workspaceId = params.workspaceId;
    this.projectId = params.projectId;
    this.entityId = params.entityId;
    this.userName = params.userName;
    this.userId = params.userId;
    this.lastActivityTime = Date.now();
    this.restoreSession();
  }

  private restoreSession() {
    const savedSessions = this.getSavedSessions();
    const sessionData = savedSessions[this._sessionKey];

    if (sessionData) {
      this.debugSession = sessionData.session;
      this.traceId = sessionData.traceId;
      this.apiKey = sessionData.apiKey;
      this.idGenerator.setSessionId(this.debugSession.shortId);

      this.initExporter(this.apiKey);
      console.log("Restored previous debug session from local storage.");
    }
  }

  private getSavedSessions() {
    const savedSessions = localStorage.getItem(SESSION_STORAGE_KEY);
    return savedSessions ? JSON.parse(savedSessions) : {};
  }

  private saveSession() {
    const savedSessions = this.getSavedSessions();
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...savedSessions,
        [this._sessionKey]: {
          apiKey: this.apiKey,
          traceId: this.traceId,
          session: this.debugSession,
        },
      })
    );
  }

  private clearSession() {
    clearInterval(this.idleTimer);
    const savedSessions = this.getSavedSessions();
    delete savedSessions[this._sessionKey];
    this.debugSession = null;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(savedSessions));
  }

  private updateLastActivity() {
    this.lastActivityTime = Date.now();
  }

  private convertMillisecondsToHrTime(milliseconds: number): [number, number] {
    const sec = Math.trunc(milliseconds / 1000);
    const nanoSec = Math.round((milliseconds % 1000) * 1e6);
    return [sec, nanoSec];
  }

  private getTimeInMs(time: number[]) {
    return time[0] * 1000 + time[1] / 1e6;
  }

  private initExporter(apiKey: string) {
    this.exporter = new SessionRecorderBrowserTraceExporter({
      url: `${config.REACT_APP_SESSION_DEBUGGER_API_BASE_URL}/v1/traces`,
      apiKey,
    });
  }

  public getDebugHeaders(spanId?: string) {
    const id = spanId || this.generateSpanId();
    return [
      {
        key: DEBUG_HEADERS.TRACEPARENT,
        value: `00-${this.traceId}-${id}-01`,
      },
      { key: DEBUG_HEADERS.TRACE_ID, value: this.traceId },
      { key: DEBUG_HEADERS.SPAN_ID, value: id },
    ];
  }

  public async startSession() {
    if (this.debugSession) return;

    this.apiKey = await getTemporaryApiKey(this.workspaceId, this.projectId);
    this.debugSession = await startDebugSession(this.apiKey, {
      name: this.userName
        ? `${this.userName
        }'s notebook session on ${new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`
        : "",
      sessionAttributes: {
        userId: this.userId,
        entityId: this.entityId,
        userName: this.userName,
      }
    });
    this.idGenerator.setSessionId(this.debugSession.shortId);
    this.traceId = this.idGenerator.generateTraceId();

    this.initExporter(this.apiKey);
    this.saveSession();
    this.emit(NotebookDebuggerEvents.START, []);
  }

  public async stopSession() {
    if (!this.debugSession) return;
    try {
      this.exportSpans();
      await stopDebugSession(this.apiKey, this.debugSession._id);
    } catch (error) {
      console.log("Failed to stop session: ", error);
    } finally {
      this.clearSession();
      this.emit(NotebookDebuggerEvents.STOP, []);
    }
  }

  public getSession() {
    return this.debugSession;
  }

  public generateSpanId() {
    return this.idGenerator.generateSpanId();
  }

  public addSpanEvent(spanId: string, event: NotebookDebuggerSpanEvent) {
    this.updateLastActivity();
    this.spansToExport[spanId]?.events.push({
      ...event,
      time: this.convertMillisecondsToHrTime(Date.now()),
    });
  }

  private reduceSpanSize(span: EditableSpan, limitInBytes: number) {
    const encoder = new TextEncoder();
    const totalSpanSize = encoder.encode(JSON.stringify(span)).length;
    let sizeToReduce = totalSpanSize - limitInBytes
    if (sizeToReduce <= 0) {
      return
    }

    let sizes = Object.keys(span.attributes).map((key) => {
      return { size: encoder.encode(JSON.stringify(span.attributes[key])).length, key }
    }).sort((a, b) => b.size - a.size)

    sizes.some(({ size, key }) => {
      span.attributes[key] = 'Span property is hidden, because of span size'
      sizeToReduce -= size
      return sizeToReduce <= 0
    })
    return
  }


  public addSpanAttrs(spanId: string, attrs: Record<string, string>) {
    this.updateLastActivity();
    if (this.spansToExport[spanId]) {
      this.spansToExport[spanId].attributes = Object.assign(
        this.spansToExport[spanId]?.attributes || {},
        attrs
      );
    }
  }

  public generateSpan(params: Notebook.GenerateSpanParams): string | undefined {
    if (!this.debugSession) return undefined;

    const spanId = params.spanId || this.idGenerator.generateSpanId();
    this.spansToExport[spanId] = {
      parentSpanContext: params.parentSpanContext,
      attributes: {
        [ATTR_MULTIPLAYER_SESSION_ID]: this.debugSession._id,
      },
      droppedAttributesCount: 0,
      droppedEventsCount: 0,
      droppedLinksCount: 0,
      ended: true,
      events: [],

      instrumentationScope: {
        name: params.instrumentation || Notebook.NotebookInstrumentation.OTHER,
      },
      kind: 2,
      links: [],
      resource: this.resource,
      duration: [0, 0],
      startTime: this.convertMillisecondsToHrTime(Date.now()),
      endTime: this.convertMillisecondsToHrTime(Date.now()),
      status: { code: 0, message: "Debug session" },
      name: params.name,
      spanContext: () => ({ traceId: this.traceId, spanId, traceFlags: 1 }),
    };
    return spanId;
  }

  public exportSpans(spanIds?: string[]) {
    this.updateLastActivity();

    if (!this.exporter) {
      console.debug("Exporter is not set");
      return;
    }

    const spansToExport = (
      spanIds
        ? spanIds.map((id) => this.spansToExport[id])
        : Object.values(this.spansToExport)
    ).filter(Boolean);

    spansToExport.forEach((span) => {
      span.duration = this.convertMillisecondsToHrTime(
        Date.now() - this.getTimeInMs(span.startTime)
      );
      this.reduceSpanSize(span, 1024 * 500)
    });

    spansToExport.forEach((span) => {
      delete this.spansToExport[span.spanContext().spanId];
    });
    this.exporter.export(spansToExport, (result) => {
      if (result.code !== 0)
        spansToExport.forEach((span) => {
          this.spansToExport[span.spanContext().spanId] = span;
        });
    });
  }

  destroy(): void {
    clearInterval(this.idleTimer);
    super.destroy();
  }
}