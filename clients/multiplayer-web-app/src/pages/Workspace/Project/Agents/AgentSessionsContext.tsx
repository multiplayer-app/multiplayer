import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { getAgentChatsList } from "shared/services/radar.service";
import useMessage from "shared/hooks/useMessage";
import type { AgentSessionsFilters } from "./AgentsSessions/AgentsSessionsFilters";
import { useAgentRuntime } from "@multiplayer-app/ai-agent-react";
import { AgentEvents } from "@multiplayer/types";

type SessionRow = Record<string, any>;

interface IAgentSessionsContext {
  sessions: { data: SessionRow[]; cursor: { total: number } };
  loading: boolean;
  hasFilters: boolean;
  filters: AgentSessionsFilters;
  setFilters: React.Dispatch<React.SetStateAction<AgentSessionsFilters>>;
  pageParams: { page: number; pageSize: number };
  setPageParams: React.Dispatch<
    React.SetStateAction<{ page: number; pageSize: number }>
  >;
  fetchSessions: () => Promise<void>;
}

const AgentSessionsContext = createContext<IAgentSessionsContext | null>(null);

const AgentSessionsProvider = ({ children }: { children: ReactNode }) => {
  const { workspaceId, projectId } = useParams();
  const message = useMessage();
  const runtime = useAgentRuntime();
  const [loading, setLoading] = useState(true);
  const [pageParams, setPageParams] = useState({ page: 1, pageSize: 20 });
  const [filtersState, setFiltersState] = useState<AgentSessionsFilters>({});
  const [sessions, setSessions] = useState<{
    data: SessionRow[];
    cursor: { total: number };
  }>({
    data: [],
    cursor: { total: 0 },
  });

  const fetchSessions = useCallback(async () => {
    if (!workspaceId || !projectId) return;
    setLoading(true);
    try {
      const skip = (pageParams.page - 1) * pageParams.pageSize;
      const result = await getAgentChatsList(workspaceId, projectId, {
        skip,
        limit: pageParams.pageSize,
        ...(filtersState.status ? { status: filtersState.status } : {}),
        ...(filtersState.agentId ? { agentId: filtersState.agentId } : {}),
        ...(filtersState.archived ? { archived: true } : { archived: false }),
      });
      setSessions({
        data: (result as any).data ?? [],
        cursor: { total: (result as any).cursor?.total ?? 0 },
      });
    } catch (err) {
      message.handleError(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, pageParams, filtersState, message]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const setFilters = useCallback(
    (updater: React.SetStateAction<AgentSessionsFilters>) => {
      setFiltersState(updater);
      setPageParams((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const hasFilters = useMemo(
    () =>
      Boolean(
        filtersState.status || filtersState.agentId || filtersState.archived
      ),
    [filtersState]
  );

  useEffect(() => {
    const s = runtime.socket;
    if (!s) return;
    s.on(AgentEvents.AGENT_CHAT_UPDATE, fetchSessions);
    s.on(AgentEvents.AGENT_CHAT_BULK_UPDATE, fetchSessions);
    s.on(AgentEvents.AGENT_CHAT_BULK_DELETE, fetchSessions);
    return () => {
      s.off(AgentEvents.AGENT_CHAT_UPDATE, fetchSessions);
      s.off(AgentEvents.AGENT_CHAT_BULK_UPDATE, fetchSessions);
      s.off(AgentEvents.AGENT_CHAT_BULK_DELETE, fetchSessions);
    };
  }, [runtime.socket]);

  return (
    <AgentSessionsContext.Provider
      value={{
        sessions,
        loading,
        hasFilters,
        filters: filtersState,
        setFilters,
        pageParams,
        setPageParams,
        fetchSessions,
      }}
    >
      {children}
    </AgentSessionsContext.Provider>
  );
};

export function useAgentSessions() {
  const context = useContext(AgentSessionsContext);
  if (context === null) {
    throw new Error(
      "useAgentSessions must be used within AgentSessionsProvider"
    );
  }
  return context;
}

export { AgentSessionsProvider };
