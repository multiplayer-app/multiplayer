import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AgentType, type IAgentChat } from "@multiplayer/types";
import { useParams } from "react-router-dom";
import { useAgentStore } from "@multiplayer-app/ai-agent-react";

import useMessage from "shared/hooks/useMessage";
import { createAgentChat } from "shared/services/radar.service";
import { useTabs } from "shared/providers/TabsContext";
import { useAgents } from "shared/providers/AgentRuntimeContext";
import { useAgentSessions } from "pages/Workspace/Project/Agents/AgentSessionsContext";

import { useAgentsPage } from "./useAgentsPage";

type PanelChatContextValue = {
  isOpen: boolean;
  activeSessionId: string | null;
  selectedAgentId: string | null;
  openPanel: (sessionId?: string | null) => void;
  closePanel: () => void;
  togglePanel: () => void;
  setActiveSessionId: (sessionId: string | null) => void;
  setSelectedAgentId: (agentId: string | null) => void;
  openInPageView: () => void;
  createSession: () => Promise<void>;
};

const PanelChatContext = createContext<PanelChatContextValue | null>(null);

export const PanelChatProvider = ({ children }: { children: ReactNode }) => {
  const message = useMessage();
  const { onAgentSessionOpen } = useTabs();
  const { workspaceId, projectId } = useParams();
  const { agents, loading: agentsLoading } = useAgents();
  const hasWorkers = agents.data.length > 0;
  const { sessions, fetchSessions } = useAgentSessions();
  const setChatHistoryOpen = useAgentStore((s) => s.setChatHistoryOpen);

  const [isOpen, setIsOpen] = useState(
    sessionStorage.getItem(OPEN_KEY) === "true"
  );
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(
    () => getLastActiveSession(projectId)
  );
  const [selectedAgentId, setSelectedAgentIdState] = useState<string | null>(
    () => getLastSelectedAgent(projectId)
  );

  const isAgentsPage = useAgentsPage();

  useEffect(() => {
    sessionStorage.setItem(OPEN_KEY, isOpen.toString());
  }, [isOpen]);

  useEffect(() => {
    if (isAgentsPage) {
      setIsOpen(false);
      setChatHistoryOpen(false);
    }
  }, [isAgentsPage, setChatHistoryOpen]);

  useEffect(() => {
    if (!agentsLoading && !hasWorkers) {
      setChatHistoryOpen(false);
    }
  }, [agentsLoading, hasWorkers, setChatHistoryOpen]);

  useEffect(() => {
    setActiveSessionIdState(getLastActiveSession(projectId));
    setSelectedAgentIdState(getLastSelectedAgent(projectId));
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !agents.data.length) return;

    const isValid = selectedAgentId
      ? agents.data.some((a) => a._id === selectedAgentId)
      : false;

    if (isValid) return;

    const stored = getLastSelectedAgent(projectId);
    const fromStored = stored
      ? agents.data.find((a) => a._id === stored)
      : undefined;
    const nextId = fromStored?._id ?? agents.data[0]._id;
    setSelectedAgentIdState(nextId);
    rememberSelectedAgent(projectId, nextId);
  }, [agents.data, projectId, selectedAgentId]);

  const setSelectedAgentId = useCallback(
    (agentId: string | null) => {
      setSelectedAgentIdState(agentId);
      rememberSelectedAgent(projectId, agentId);
    },
    [projectId]
  );

  const setActiveSessionId = useCallback(
    (sessionId: string | null) => {
      setActiveSessionIdState(sessionId);
      rememberActiveSession(projectId, sessionId);
      setChatHistoryOpen(hasWorkers && !sessionId);

      if (sessionId) {
        const session = sessions.data.find((s) => s._id === sessionId);
        if (session?.agent) {
          setSelectedAgentIdState(session.agent);
          rememberSelectedAgent(projectId, session.agent);
        }
      }
    },
    [hasWorkers, projectId, sessions.data, setChatHistoryOpen]
  );

  const openPanel = useCallback(
    (sessionId?: string | null) => {
      setIsOpen(true);
      if (sessionId !== undefined) {
        setActiveSessionId(sessionId);
      } else {
        setChatHistoryOpen(hasWorkers && !activeSessionId);
      }
    },
    [activeSessionId, hasWorkers, setActiveSessionId, setChatHistoryOpen]
  );

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setChatHistoryOpen(false);
  }, [setChatHistoryOpen]);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        setChatHistoryOpen(false);
        return false;
      }
      setChatHistoryOpen(hasWorkers && !activeSessionId);
      return true;
    });
  }, [activeSessionId, hasWorkers, setChatHistoryOpen]);

  const openInPageView = useCallback(() => {
    if (!activeSessionId) return;
    const session = sessions.data.find((s) => s._id === activeSessionId) as
      | IAgentChat
      | undefined;
    if (session) {
      onAgentSessionOpen(session);
    }
  }, [activeSessionId, onAgentSessionOpen, sessions.data]);

  const createSession = useCallback(async () => {
    if (!workspaceId || !projectId || !selectedAgentId) return;

    const agent = agents.data.find((a) => a._id === selectedAgentId);
    if (!agent) return;

    try {
      const created = await createAgentChat(workspaceId, projectId, {
        agentId: selectedAgentId,
        agentType: agent.type ?? AgentType.DEBUGGING,
      });
      const createdId =
        (created as { _id?: string; id?: string; chatId?: string })._id ??
        (created as { id?: string }).id ??
        (created as { chatId?: string }).chatId ??
        "";

      await fetchSessions();

      if (createdId) {
        setActiveSessionId(String(createdId));
        setChatHistoryOpen(false);
        setIsOpen(true);
      }
    } catch (err) {
      message.handleError(err);
    }
  }, [
    workspaceId,
    projectId,
    selectedAgentId,
    agents.data,
    fetchSessions,
    message,
    setActiveSessionId,
    setChatHistoryOpen,
  ]);

  const value = useMemo(
    () => ({
      isOpen,
      activeSessionId,
      selectedAgentId,
      openPanel,
      closePanel,
      togglePanel,
      setActiveSessionId,
      setSelectedAgentId,
      openInPageView,
      createSession,
    }),
    [
      isOpen,
      activeSessionId,
      selectedAgentId,
      openPanel,
      closePanel,
      togglePanel,
      setActiveSessionId,
      setSelectedAgentId,
      openInPageView,
      createSession,
    ]
  );

  return (
    <PanelChatContext.Provider value={value}>
      {children}
    </PanelChatContext.Provider>
  );
};

export function usePanelChat() {
  const context = useContext(PanelChatContext);
  if (context === null) {
    throw new Error("usePanelChat must be used within PanelChatProvider");
  }
  return context;
}

export const usePanelChatOpen = () => {
  const { isOpen } = usePanelChat();
  return isOpen;
};

const LAST_ACTIVE_SESSION_KEY = "agentChatLastActiveSessionByProject";
const LAST_SELECTED_AGENT_KEY = "agentChatLastSelectedAgentByProject";
const OPEN_KEY = "agentChatOpen";

function readLastActiveSessions(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(LAST_ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getLastActiveSession(projectId: string | undefined): string | null {
  if (!projectId) return null;
  return readLastActiveSessions()[projectId] ?? null;
}

function rememberActiveSession(
  projectId: string | undefined,
  sessionId: string | null
) {
  if (!projectId || !sessionId) return;
  sessionStorage.setItem(
    LAST_ACTIVE_SESSION_KEY,
    JSON.stringify({ ...readLastActiveSessions(), [projectId]: sessionId })
  );
}

function readLastSelectedAgents(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(LAST_SELECTED_AGENT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getLastSelectedAgent(projectId: string | undefined): string | null {
  if (!projectId) return null;
  return readLastSelectedAgents()[projectId] ?? null;
}

function rememberSelectedAgent(
  projectId: string | undefined,
  agentId: string | null
) {
  if (!projectId || !agentId) return;
  sessionStorage.setItem(
    LAST_SELECTED_AGENT_KEY,
    JSON.stringify({ ...readLastSelectedAgents(), [projectId]: agentId })
  );
}
