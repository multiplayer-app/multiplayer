import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { unpack } from "@rrweb/packer";
import { EventType, eventWithTime, metaEvent } from "@rrweb/types";
import { Replayer } from "rrweb";
import {
  IDebugSession,
  DebugSessionDataType,
  IDebugSessionRrwebEvent,
  DebugSessionEvents,
  DebugSessionAgentEvents,
  DebugSessionSubscribeDataRequestParams,
  DebugSessionUnsubscribeDataRequestParams,
  DebugSessionOtelTraceCreatedResponseParams,
  DebugSessionOtelLogCreatedResponseParams,
  DebugSessionRrwebEventCreatedResponseParams,
} from "@multiplayer/types";

import {
  getSessionLogs,
  getDebugSession,
  getSessionTraces,
  getSessionEvents,
} from "shared/services/radar.service";
import { fetchAllData } from "shared/helpers/api.helpers";
import { fetchAllUrlsContent, fetchUrlContent } from "shared/api";
import { clone } from "shared/utils";

import {
  ILogData,
  ITraceData,
  IConsoleNode,
  IDebugSessionNode,
  DebugSessionNodeType,
  DebugSessionNodesState,
} from "./types";
import {
  isConsoleEvent,
  buildTraceTree,
  newDebugSessionNode,
  isUserInteractionEvent,
  dedupeConsoleEvents,
} from "./utils";
import { SessionType } from "@multiplayer-app/session-recorder-react";
import { useDebugSessionsSocket } from "shared/providers/DebugSessionsContext";
import { useLiveDataManager } from "./useLiveDataManager";
import { useEventEmitter } from "shared/hooks/useEventEmitter";

const debugSessionNodesState = {
  [DebugSessionNodeType.Event]: [],
  [DebugSessionNodeType.Console]: [],
  [DebugSessionNodeType.Trace]: [],
  [DebugSessionNodeType.Log]: [],
};

interface UseDebugSessionDataReturn {
  session: IDebugSession | undefined;
  events: eventWithTime[];
  metadata: metaEvent | null;
  sessionNodes: DebugSessionNodesState;
  sessionLoading: boolean;
  eventsLoading: boolean;
  tracesLoading: boolean;
  logsLoading: boolean;
  setSession: React.Dispatch<React.SetStateAction<IDebugSession | undefined>>;
  setMetadata: React.Dispatch<metaEvent>;
  setPlayerRef: (player: Replayer | null) => void;
  playerRef: Replayer | null;
}

export const useDebugSessionData = (
  sessionId: string
): UseDebugSessionDataReturn => {
  const socket = useDebugSessionsSocket();
  const { subscribeToEvent } = useEventEmitter();
  const { workspaceId, projectId } = useParams();
  const [events, setEvents] = useState<eventWithTime[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [session, setSession] = useState<IDebugSession>();
  const [eventsLoading, setEventsLoading] = useState(true);
  const [tracesLoading, setTracesLoading] = useState(true);
  const [metadata, setMetadata] = useState<metaEvent>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionNodes, setSessionNodes] = useState<DebugSessionNodesState>(
    clone(debugSessionNodesState)
  );

  // Initialize live data manager
  const liveDataManager = useLiveDataManager(
    setEvents,
    setSessionNodes,
    setMetadata
  );

  useEffect(() => {
    const subscriptions = [];
    const fetchSession = async () => {
      try {
        setSessionLoading(true);
        const res = await getDebugSession(workspaceId, projectId, sessionId);
        if (res) {
          setSession(res);

          if (!res?.stoppedAt) {
            subscriptions.push(
              subscribeToEvent(
                DebugSessionAgentEvents.DEBUG_SESSION_STOPPED,
                sessionId,
                fetchSession
              )
            );
            subscriptions.push(
              subscribeToEvent(
                DebugSessionEvents.DEBUG_SESSION_CANCELED,
                sessionId,
                () => setSession(null)
              )
            );
          }
          if (res?.s3Files?.length) {
            const groupedEvents = [];

            res?.s3Files.forEach((collection) => {
              switch (collection.dataType) {
                case DebugSessionDataType.OTLP_LOGS:
                  fetchLogs(collection.url);
                  break;
                case DebugSessionDataType.OTLP_TRACES:
                  fetchTraces(collection.url);
                  break;
                case DebugSessionDataType.RRWEB_EVENTS:
                  groupedEvents.push(collection.url);
                  break;
              }
            });

            fetchEvents(groupedEvents, res.startedAt);
          } else {
            // not finished uploading to s3 yet, fetching with old way
            fetchEvents(undefined, res.startedAt);
            fetchTraces();
            fetchLogs();
          }
        } else {
          setSession(null);
        }
      } catch (err) {
        console.error(err);
      }
      setSessionLoading(false);
    };

    const fetchEvents = async (
      urls?: string[],
      sessionStartedAt?: string | Date
    ) => {
      try {
        setEventsLoading(true);
        const res = await (urls?.length
          ? fetchAllUrlsContent(urls)
          : fetchAllData<IDebugSessionRrwebEvent>(
              getSessionEvents.bind(null, workspaceId, projectId, sessionId),
              {},
              0,
              100
            ));

        const eventsList = (urls?.length ? res?.flat() : res)
          ?.filter((e) => e.data)
          .map((e) => ({
            id: e.id,
            t: e.timestamp,
            ...unpack(e.data),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        setEvents(eventsList);

        if (eventsList.length) {
          const consoleNodes = dedupeConsoleEvents(
            eventsList.filter(isConsoleEvent)
          ).map((item) =>
            newDebugSessionNode<IConsoleNode>(DebugSessionNodeType.Console,item)
          );
          setSessionNodes((prev) => ({
            ...prev,
            [DebugSessionNodeType.Console]: consoleNodes,
          }));
          setMetadata(
            eventsList.find((e) => e.type === EventType.Meta) as metaEvent
          );
        } else {
          setSessionNodes((prev) => ({
            ...prev,
            [DebugSessionNodeType.Console]: [],
          }));
        }
      } catch (error) {
        console.log(error);
      }
      setEventsLoading(false);
    };

    const fetchTraces = async (url?: string) => {
      try {
        setTracesLoading(true);
        const res =
          (await (url
            ? fetchUrlContent(url)
            : fetchAllData<ITraceData>(
                getSessionTraces.bind(null, workspaceId, projectId, sessionId),
                {},
                0,
                300
              ))) || [];

        const seenSpanIds = new Set<string>();
        const traces = res
          .filter((trace: ITraceData) => {
            if (seenSpanIds.has(trace.SpanId)) {
              return false;
            }
            seenSpanIds.add(trace.SpanId);
            return true;
          })
          .map((trace: ITraceData) =>
            newDebugSessionNode(
              isUserInteractionEvent(trace)
                ? DebugSessionNodeType.Event
                : DebugSessionNodeType.Trace,
              trace
            )
          )
          .sort((a, b) => a.timestamp - b.timestamp);

        const groupedTraces = buildTraceTree(
          traces as IDebugSessionNode<ITraceData>[]
        );
        const eventNodes: IDebugSessionNode<ITraceData>[] = [];
        const traceNodes: IDebugSessionNode<ITraceData>[] = [];

        groupedTraces.forEach((node) => {
          if (node.type === DebugSessionNodeType.Event) {
            eventNodes.push(node);
          } else {
            traceNodes.push(node);
          }
        });

        setSessionNodes((prev) => ({
          ...prev,
          [DebugSessionNodeType.Trace]: traceNodes,
          [DebugSessionNodeType.Event]: eventNodes,
        }));
      } catch (err) {
        console.error(err);
      }
      setTracesLoading(false);
    };

    const fetchLogs = async (url?: string) => {
      try {
        setLogsLoading(true);
        const logs = await (url
          ? fetchUrlContent(url)
          : fetchAllData(
              getSessionLogs.bind(null, workspaceId, projectId, sessionId),
              {},
              0,
              300
            ));

        const logNodes = logs
          ?.map((item: ILogData) =>
            newDebugSessionNode(DebugSessionNodeType.Log, item)
          )
          .sort((a, b) => a.timestamp - b.timestamp);

        setSessionNodes((prev) => ({
          ...prev,
          [DebugSessionNodeType.Log]: logNodes,
        }));
      } catch (err) {
        console.error(err);
      }
      setLogsLoading(false);
    };

    if (sessionId) {
      fetchSession();
    }

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessionId, workspaceId, projectId, subscribeToEvent]);

  // Live session data streaming
  const isLive = session && !session.stoppedAt;

  useEffect(() => {
    if (!socket || !isLive) return;

    const sessionArgs: DebugSessionSubscribeDataRequestParams = {
      workspaceId,
      projectId,
      debugSessionId: sessionId,
      debugSessionType: SessionType.PLAIN,
    };

    const onRrwebEvent = (
      payload: DebugSessionRrwebEventCreatedResponseParams
    ) => {
      const { data } = payload;
      if (!data?.data) return;
      const unpackedEvent = unpack(data.data);
      liveDataManager.injectLiveEvent(unpackedEvent as eventWithTime);
    };

    const onOtelTraceEvent = (
      payload: DebugSessionOtelTraceCreatedResponseParams
    ) => {
      liveDataManager.injectLiveTrace(payload.data as unknown as ITraceData[]);
    };

    const onOtelLogEvent = (
      payload: DebugSessionOtelLogCreatedResponseParams
    ) => {
      liveDataManager.injectLiveLog(payload.data as unknown as ILogData[]);
    };

    let isSubscribed = false;

    if (isLive) {
      isSubscribed = true;
      // Subscribe to live events
      socket.on(
        DebugSessionEvents.DEBUG_SESSION_OTEL_LOG_CREATED,
        onOtelLogEvent
      );
      socket.on(
        DebugSessionEvents.DEBUG_SESSION_RRWEB_EVENT_CREATED,
        onRrwebEvent
      );
      socket.on(
        DebugSessionEvents.DEBUG_SESSION_OTEL_TRACE_CREATED,
        onOtelTraceEvent
      );

      // Emit subscription request
      socket.emit(DebugSessionEvents.DEBUG_SESSION_DATA_SUBSCRIBE, sessionArgs);
    }

    return () => {
      if (isSubscribed) {
        // Unsubscribe from events
        socket.off(
          DebugSessionEvents.DEBUG_SESSION_OTEL_LOG_CREATED,
          onOtelLogEvent
        );
        socket.off(
          DebugSessionEvents.DEBUG_SESSION_RRWEB_EVENT_CREATED,
          onRrwebEvent
        );
        socket.off(
          DebugSessionEvents.DEBUG_SESSION_OTEL_TRACE_CREATED,
          onOtelTraceEvent
        );

        const unsubscribeParams: DebugSessionUnsubscribeDataRequestParams = {
          debugSessionId: sessionId,
        };
        socket.emit(
          DebugSessionEvents.DEBUG_SESSION_DATA_UNSUBSCRIBE,
          unsubscribeParams
        );
      }
    };
  }, [socket, workspaceId, projectId, sessionId, isLive]);

  return {
    session,
    events,
    metadata,
    sessionNodes,
    logsLoading,
    tracesLoading,
    eventsLoading,
    sessionLoading,
    setSession,
    setMetadata,
    setPlayerRef: liveDataManager.setPlayerRef,
    playerRef: liveDataManager.playerRef,
  };
};
