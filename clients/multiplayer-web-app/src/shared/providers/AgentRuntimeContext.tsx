import {
  AgentProvider,
  type AgentFrontendConfig,
  useAgentRuntime,
} from "@multiplayer-app/ai-agent-react";
import { useColorMode } from "@chakra-ui/react";
import { AgentEvents, IAgent } from "@multiplayer/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";

import useMessage from "shared/hooks/useMessage";
import { IListRes } from "shared/models/interfaces";
import { useAuth } from "shared/providers/AuthContext";
import { config } from "../../config";
import { useProject } from "shared/providers/ProjectContext";
import { getAgents } from "shared/services/radar.service";

import {
  AGENT_CONTEXT_KEYS,
  IAgentsFilters,
  AGENT_UI_FEATURES,
  AGENT_UI_THEME,
} from "pages/Workspace/Project/Agents/agents.constants";
import { AGENT_TOOL_RENDERERS } from "pages/Workspace/Project/Agents/AgentTools";
import SessionPicker from "shared/components/AgentChat/attachments/composer/SessionPicker";
import { attachmentIcons } from "shared/components/AgentChat/attachments/icons";

const radarPrefix = config.REACT_APP_RADAR_PREFIX;
const apiBaseURL = config.REACT_APP_API_BASE_URL;
const agentsBaseURL = apiBaseURL + radarPrefix;

const DEFAULT_FILTERS: IAgentsFilters = {
  skip: 0,
  limit: 10,
  sortKey: "createdAt",
  sortDirection: "-1",
  type: [],
  status: [],
};

interface IAgentsContext {
  loading: boolean;
  agents: IListRes<IAgent>;
}

const AgentsContext = createContext<IAgentsContext | null>(null);

export const AgentRuntimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { workspaceId, projectId } = useParams();
  const { colorMode } = useColorMode();
  const { user } = useAuth();

  const config = useMemo<AgentFrontendConfig>(() => {
    const basePath = `/workspaces/${workspaceId}/projects/${projectId}/agents`;

    return {
      appId: "multiplayer-web-app",
      workspaceId,
      debug: false,
      user: user
        ? {
            id: user._id,
            displayName:
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.primaryEmail,
            email: user.primaryEmail,
          }
        : { id: "guest" },
      contextKeys: AGENT_CONTEXT_KEYS,
      defaultContextKey: "agent",
      transport: {
        mode: "proxy",
        baseUrl: `${agentsBaseURL}${basePath}`,
        socketPath: `${radarPrefix}/ws`,
        socketNamespace: basePath,
      },
      features: AGENT_UI_FEATURES,
      theme: { ...AGENT_UI_THEME, colorMode },
      toolRenderers: AGENT_TOOL_RENDERERS,
      composerAttachmentActions: SessionPicker,
      contextAttachmentIcons: attachmentIcons,
    };
  }, [workspaceId, projectId, user, colorMode]);

  return (
    <AgentProvider config={config}>
      <AgentsProvider>{children}</AgentsProvider>
    </AgentProvider>
  );
};

export const AgentsProvider = ({ children }: { children: React.ReactNode }) => {
  const message = useMessage();
  const runtime = useAgentRuntime();
  const { workspaceId } = useParams();
  const { projectId } = useProject();
  const [agents, setAgents] = useState<IListRes<IAgent>>({
    data: [],
    cursor: { total: 0, skip: 0, limit: 10 },
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<IAgentsFilters>(DEFAULT_FILTERS);

  const fetchAgents = useCallback(async () => {
    if (!workspaceId || !projectId) return;

    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        skip: filters.skip,
        limit: filters.limit,
        sortKey: filters.sortKey,
        sortDirection: filters.sortDirection,
      };

      if (filters.type?.length === 1) {
        params.type = filters.type[0].value;
      }

      const res = await getAgents(workspaceId, projectId, params as any);
      setAgents(res);
    } catch (error) {
      message.handleError(error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, filters, message]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    const socket = runtime.socket;
    if (!socket) return;

    socket.on(AgentEvents.AGENT_CONNECTED, fetchAgents);
    socket.on(AgentEvents.AGENT_DISCONNECTED, fetchAgents);
    socket.on(AgentEvents.DEBUGGING_AGENT_UPDATED, fetchAgents);

    return () => {
      socket.off(AgentEvents.AGENT_CONNECTED, fetchAgents);
      socket.off(AgentEvents.AGENT_DISCONNECTED, fetchAgents);
      socket.off(AgentEvents.DEBUGGING_AGENT_UPDATED, fetchAgents);
    };
  }, [runtime.socket, fetchAgents]);

  const value = useMemo(() => ({ agents, loading }), [agents, loading]);

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
};

export const useAgents = () => {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error("useAgents must be used within AgentsProvider");
  }
  return context;
};
