import { memo } from "react";
import { Flex } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { IntegrationTypeEnum } from "@multiplayer/types";

import PageLoading from "shared/components/PageLoading";
import { useAgents } from "shared/providers/AgentRuntimeContext";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { useTabs } from "shared/providers/TabsContext";

import AgentDetails from "./AgentDetails";
import AgentsIntro from "./AgentsIntro";
import AgentsSessions from "./AgentsSessions";

import {
  AgentSessionsProvider,
  useAgentSessions,
} from "./AgentSessionsContext";

const AgentsRootContent = memo(() => {
  const { agents } = useAgents();
  const { path: sessionId } = useParams();
  const { onAgentSessionOpen } = useTabs();
  const { sessions, hasFilters, loading } = useAgentSessions();
  const { integrations, isIntegrationsLoaded } = useIntegrations();

  const apiKeyIntegrations = integrations.get(IntegrationTypeEnum.API_KEY);
  const hasIntegrations = apiKeyIntegrations && apiKeyIntegrations.length > 0;

  if (!isIntegrationsLoaded) {
    return <PageLoading />;
  }

  if (
    (sessions.cursor.total > 0 && !hasFilters) ||
    agents.cursor.total > 0 ||
    hasIntegrations
  ) {
    if (sessionId) {
      return (
        <Flex direction="column" h="full" minH="0">
          <AgentDetails sessionId={sessionId} />
        </Flex>
      );
    }

    return (
      <Flex direction="column" h="full" minH="0" overflow="auto">
        <AgentsSessions
          agents={agents.data}
          onSessionOpen={onAgentSessionOpen}
        />
      </Flex>
    );
  }

  if (loading) {
    return <PageLoading />;
  }

  return <AgentsIntro />;
});

const Agents = () => {
  return (
    <AgentSessionsProvider>
      <AgentsRootContent />
    </AgentSessionsProvider>
  );
};

export default memo(Agents);
