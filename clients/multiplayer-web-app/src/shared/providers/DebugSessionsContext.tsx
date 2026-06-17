import { IDebugSession } from "@multiplayer/types";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";
import {
  getDebugSessions,
  updateDebugSession,
  deleteDebugSession,
} from "shared/services/radar.service";
import { IListRes } from "shared/models/interfaces";
import { useTabs } from "shared/providers/TabsContext";
import useMessage from "shared/hooks/useMessage";
import { useProject } from "shared/providers/ProjectContext";
import {
  checkFilters,
  getCombinedFilters,
  IDebugSessionsFilters,
  useDebugSessionsFilters,
} from "shared/hooks/useDebugSessionsFilters";
import { useDebugSessionsState } from "shared/hooks/useDebugSessionsState";
import { ProjectSourceType } from "shared/models/enums";
import { useEventSubscription } from "shared/hooks/useEventSubscription";

interface IDebugSessionsContext {
  sessions: IListRes<IDebugSession>;
  socket: Socket | null;
  loading: boolean;
  filters: IDebugSessionsFilters;
  hasFilters: boolean;
  sessionsStateRef: React.MutableRefObject<{ scrollTop: number }>;
  setFilters: React.Dispatch<React.SetStateAction<IDebugSessionsFilters>>;
  setSessions: React.Dispatch<React.SetStateAction<IListRes<IDebugSession>>>;
  getSessions: (params: any) => any;
  updateSession: (
    id: string,
    newSession: Partial<IDebugSession>
  ) => Promise<IDebugSession>;
  deleteSession: (id: string) => Promise<void>;
}

type SessionRealtimePayload =
  | IDebugSession
  | { action: "upsert" | "delete"; session: IDebugSession };

const DebugSessionsContext = createContext<IDebugSessionsContext | null>(null);

const DebugSessionsProvider = ({ children }: { children: ReactNode }) => {
  const message = useMessage();
  const sessionsStateRef = useRef({ scrollTop: 0 });
  const { emitUpdate } = useProject();
  const { setTabs } = useTabs();
  const [loading, setLoading] = useState(true);
  const { workspaceId, projectId } = useParams();
  const { filters, setFilters, hasFilters, setHasFilters } =
    useDebugSessionsFilters();
  const { socket, sessions, setSessions } = useDebugSessionsState();

  const getSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = getCombinedFilters(filters);
      const res = await getDebugSessions(workspaceId, projectId, params);
      setSessions((prev) => ({
        cursor: res.cursor,
        data: res.data, //params.skip ? [...prev.data, ...res.data] : res.data,
      }));
      setHasFilters(checkFilters(filters));
    } catch (err) {
      message.handleError(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, filters, message]);

  const updateSession = async (
    id: string,
    payload: Partial<IDebugSession>
  ): Promise<IDebugSession> => {
    try {
      const res = await updateDebugSession(workspaceId, projectId, id, payload);

      setSessions((prev) => ({
        ...prev,
        data: prev.data.map((session) => (session._id === id ? res : session)),
      }));

      setTabs((prev) =>
        prev.map((t) => (t._id === id ? { ...t, key: res.name } : t))
      );
      // Emit session update to subscribers
      emitUpdate(ProjectSourceType.DEBUGGER, id, res);

      return res;
    } catch (err) {
      message.handleError(err);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await deleteDebugSession(workspaceId, projectId, id);
      setSessions((prev) => ({
        ...prev,
        cursor: {
          ...prev.cursor,
          total: prev.cursor.total - 1,
        },
        data: prev.data.filter((session) => session._id !== id),
      }));
    } catch (err) {
      message.handleError(err);
    }
  };

  useEffect(() => {
    getSessions();
  }, [getSessions]);

  const normalizePayload = (
    payload: SessionRealtimePayload
  ): { action: "upsert" | "delete"; session: IDebugSession } | null => {
    if (!payload) {
      return null;
    }

    if ("session" in payload) {
      return payload;
    }

    if (payload?._id) {
      return { action: "upsert", session: payload };
    }

    return null;
  };

  const updateSessions = useCallback((payload: SessionRealtimePayload) => {
    const normalized = normalizePayload(payload);
    if (!normalized?.session?._id) {
      return;
    }

    const { action, session } = normalized;

    setSessions((prev) => {
      if (action === "delete") {
        return {
          ...prev,
          cursor: {
            ...prev.cursor,
            total: Math.max(0, prev.cursor.total - 1),
          },
          data: prev.data.filter((sess) => sess._id !== session._id),
        };
      }

      return {
        ...prev,
        data: prev.data.map((s) => (s._id === session._id ? session : s)),
      };
    });
  }, []);

  useEventSubscription(ProjectSourceType.DEBUGGER, null, updateSessions, []);

  return (
    <DebugSessionsContext.Provider
      value={{
        socket,
        loading,
        sessions,
        filters,
        hasFilters,
        sessionsStateRef,
        setFilters,
        setSessions,
        getSessions,
        updateSession,
        deleteSession,
      }}
    >
      {children}
    </DebugSessionsContext.Provider>
  );
};

export function useDebugSessions() {
  const context = useContext(DebugSessionsContext);
  if (context === null) {
    throw new Error(
      "useDebugSessions must be used within DebugSessionsProvider"
    );
  }
  return context;
}

export function useDebugSessionsSocket() {
  const context = useContext(DebugSessionsContext);
  if (context === null) return null;
  return context.socket;
}

export { DebugSessionsProvider };
