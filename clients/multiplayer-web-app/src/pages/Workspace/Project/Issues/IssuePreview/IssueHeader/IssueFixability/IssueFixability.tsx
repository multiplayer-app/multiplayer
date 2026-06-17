import {
  Button,
  Icon,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from "@chakra-ui/react";
import { AgentType, type IAgent } from "@multiplayer/types";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import useMessage from "shared/hooks/useMessage";
import { useAgents } from "shared/providers/AgentRuntimeContext";
import { useIssue } from "shared/providers/IssueContext";
import { useProject } from "shared/providers/ProjectContext";
import { createAgentChat } from "shared/services/radar.service";

const PATH_TRUNCATE_MAX = 46;

const IssueFixability = () => {
  const message = useMessage();
  const { issue } = useIssue();
  const { navigate } = useProject();
  const { agents, loading: loadingAgents } = useAgents();
  const [loading, setLoading] = useState(false);
  const { workspaceId, projectId } = useParams();

  if (!issue) return null;

  const handleFix = async (agentId: string) => {
    try {
      setLoading(true);
      const res = await createAgentChat(workspaceId, projectId, {
        agentId,
        agentType: AgentType.DEBUGGING,
        context: {
          issue: {
            componentHash: issue.componentHash,
          },
        },
      });
      navigate(`agents/chats/${res._id}`);
    } catch (e) {
      message.handleError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="success"
        isLoading={loading}
        leftIcon={<Icon as={SparklesIcon} />}
      >
        Fix issue
      </MenuButton>
      <MenuList maxH="70vh" overflowY="auto" minW="min(100vw - 32px, 320px)">
        <MenuGroup
          mx="2"
          mt="0"
          mb="0"
          fontSize="sm"
          color="muted"
          fontWeight="semibold"
          title="Select an agent"
        >
          {loadingAgents ? (
            <MenuItem isDisabled pointerEvents="none">
              Loading agents…
            </MenuItem>
          ) : agents.data.length === 0 ? (
            <MenuItem isDisabled pointerEvents="none" color="muted">
              No agents available
            </MenuItem>
          ) : (
            agents.data.map((agent) => (
              <AgentPickMenuItem
                key={agent._id}
                agent={agent}
                onPick={(id) => void handleFix(id)}
              />
            ))
          )}
        </MenuGroup>
      </MenuList>
    </Menu>
  );
};

/** Keeps start + end so roots and leaf dirs stay readable; full string via native tooltip (`title`). */
const truncatePathMiddle = (path: string, maxLength: number): string => {
  if (path.length <= maxLength) return path;
  const sep = "…";
  if (maxLength <= sep.length + 2) return path.slice(0, maxLength);
  const keep = maxLength - sep.length;
  const left = Math.ceil(keep / 2);
  const right = Math.floor(keep / 2);
  return `${path.slice(0, left)}${sep}${path.slice(-right)}`;
};

const AgentPickMenuItem = ({
  agent,
  onPick,
}: {
  agent: IAgent;
  onPick: (id: string) => void;
}) => {
  return (
    <MenuItem alignItems="flex-start" py={2} onClick={() => onPick(agent._id)}>
      <VStack align="stretch" spacing={0.5} w="full" minW={0}>
        <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
          {agent.name || agent._id}
        </Text>
        {agent.contextPath ? (
          <Text
            fontSize="xs"
            color="muted"
            fontFamily="mono"
            whiteSpace="nowrap"
            overflow="hidden"
            title={agent.contextPath}
          >
            {truncatePathMiddle(agent.contextPath, PATH_TRUNCATE_MAX)}
          </Text>
        ) : null}
      </VStack>
    </MenuItem>
  );
};

export default IssueFixability;
