import { useRef, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";
import {
  IDebugSession,
  DebugSessionEvents,
  DebugSessionAgentEvents,
  DebugSessionUpdatedResponseParams,
  DebugSessionCanceledResponseParams,
  DebugSessionSubscribeProjectRequestParams,
  DebugSessionUnsubscribeProjectRequestParams,
} from "@multiplayer/types";
import { ProjectSourceType } from "shared/models/enums";
import { IListRes } from "shared/models/interfaces";
import { useEventEmitter } from "./useEventEmitter";
import { useRadarSocket } from "./useRadarSocket";

interface UseDebugSessionsStateReturn {
  socket: Socket | null;
  sessions: IListRes<IDebugSession>;
  setSessions: React.Dispatch<React.SetStateAction<IListRes<IDebugSession>>>;
}

export const useDebugSessionsState = (): UseDebugSessionsStateReturn => {
  const { emitEvent } = useEventEmitter();
  const { workspaceId, projectId } = useParams();
  const { socket } = useRadarSocket({
    workspaceId,
    projectId,
    namespace: "debug-sessions",
    enabled: Boolean(workspaceId && projectId),
  });
  const [sessions, setSessions] = useState<IListRes<IDebugSession>>({
    cursor: { skip: null, limit: 100, total: 0 },
    data: [] as IDebugSession[],
  });
  const socketRef = useRef<Socket | null>(null);

  const onStop = useCallback(
    ({ data }: DebugSessionUpdatedResponseParams) => {
      emitEvent(DebugSessionAgentEvents.DEBUG_SESSION_STOPPED, data._id, data);
      emitEvent(ProjectSourceType.DEBUGGER, data._id, {
        action: "upsert",
        session: data,
      });
      setSessions((prev) => {
        const index = prev.data.findIndex(
          (session) => session._id === data._id
        );
        const isNew = index === -1;
        const updatedData = isNew
          ? [data, ...prev.data]
          : prev.data.map((session) =>
              session._id === data._id ? data : session
            );

        return {
          cursor: {
            ...prev.cursor,
            total: isNew ? prev.cursor.total : prev.cursor.total + 1,
          },
          data: updatedData,
        };
      });
    },
    [emitEvent]
  );

  const onStart = useCallback(
    ({ data }: DebugSessionUpdatedResponseParams) => {
      emitEvent(ProjectSourceType.DEBUGGER, data._id, {
        action: "upsert",
        session: data,
      });
      setSessions((prev) => ({
        cursor: { ...prev.cursor, total: prev.cursor.total + 1 },
        data: [data, ...prev.data],
      }));
    },
    [emitEvent]
  );

  const onCancel = useCallback(
    ({ data }: DebugSessionCanceledResponseParams) => {
      emitEvent(DebugSessionEvents.DEBUG_SESSION_CANCELED, data._id, null);
      emitEvent(ProjectSourceType.DEBUGGER, data._id, {
        action: "delete",
        session: data,
      });
      setSessions((prev) => {
        const newData = prev.data.filter((session) => session._id !== data._id);
        return {
          cursor: { ...prev.cursor, total: prev.cursor.total - 1 },
          data: newData,
        };
      });
    },
    [emitEvent]
  );

  const subscribeToSessions = useCallback(
    (workspaceId, projectId) => {
      socketRef.current.on(
        DebugSessionAgentEvents.DEBUG_SESSION_STOPPED,
        onStop
      );
      socketRef.current.on(
        DebugSessionAgentEvents.DEBUG_SESSION_STARTED,
        onStart
      );
      socketRef.current.on(DebugSessionEvents.DEBUG_SESSION_CANCELED, onCancel);
      socketRef.current.on(
        DebugSessionEvents.DEBUG_SESSION_AUTO_CREATED,
        onStop
      );
      const subscribeProjectParams: DebugSessionSubscribeProjectRequestParams =
        { workspaceId, projectId };
      socketRef.current.emit(
        DebugSessionEvents.DEBUG_SESSION_SUBSCRIBE_PROJECT,
        subscribeProjectParams
      );
    },
    [onStop, onStart, onCancel]
  );

  const unsubscribeFromSessions = useCallback(
    (workspaceId, projectId) => {
      socketRef.current.off(
        DebugSessionAgentEvents.DEBUG_SESSION_STOPPED,
        onStop
      );
      socketRef.current.off(
        DebugSessionAgentEvents.DEBUG_SESSION_STARTED,
        onStart
      );
      socketRef.current.off(
        DebugSessionEvents.DEBUG_SESSION_CANCELED,
        onCancel
      );
      socketRef.current.off(
        DebugSessionEvents.DEBUG_SESSION_AUTO_CREATED,
        onStop
      );
      const unsubscribeProjectParams: DebugSessionUnsubscribeProjectRequestParams =
        { workspaceId, projectId };
      socketRef.current.emit(
        DebugSessionEvents.DEBUG_SESSION_UNSUBSCRIBE_PROJECT,
        unsubscribeProjectParams
      );
    },
    [onStop, onStart, onCancel]
  );

  useEffect(() => {
    if (socket && !socketRef.current) {
      socketRef.current = socket;
    }

    if (!socketRef.current) return;

    const onConnect = () => {
      subscribeToSessions(workspaceId, projectId);
    };
    const onDisconnect = () => {
      unsubscribeFromSessions(workspaceId, projectId);
    };

    socketRef.current.on("connect", onConnect);
    socketRef.current.on("disconnect", onDisconnect);
    return () => {
      socketRef.current.off("connect", onConnect);
      socketRef.current.off("disconnect", onDisconnect);
      unsubscribeFromSessions(workspaceId, projectId);
    };
  }, [
    socket,
    workspaceId,
    projectId,
    subscribeToSessions,
    unsubscribeFromSessions,
  ]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    sessions,
    setSessions,
  };
};
