import { useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from "@chakra-ui/react";
import { AgentStatus, type IAgent } from "@multiplayer/types";
import { ChevronDownIcon } from "lucide-react";

import Icon from "shared/components/Icon";
import { useAgents } from "shared/providers/AgentRuntimeContext";
import { AGENT_STATUS_COLOR_MAP } from "pages/Workspace/Project/Agents/agents.constants";
import { usePanelChat } from "../context/panelContext";

const PATH_TRUNCATE_MAX = 40;

const truncatePathMiddle = (path: string, maxLength: number): string => {
  if (path.length <= maxLength) return path;
  const sep = "…";
  if (maxLength <= sep.length + 2) return path.slice(0, maxLength);
  const keep = maxLength - sep.length;
  const left = Math.ceil(keep / 2);
  const right = Math.floor(keep / 2);
  return `${path.slice(0, left)}${sep}${path.slice(-right)}`;
};

const isWorkerReady = (worker: IAgent) =>
  (worker.issuesInProgress ?? 0) < (worker.maxConcurrentIssues ?? 2);

const AgentPicker = () => {
  const { agents, loading } = useAgents();
  const { selectedAgentId, setSelectedAgentId } = usePanelChat();

  const selectedAgent = useMemo(
    () => agents.data.find((a) => a._id === selectedAgentId),
    [agents.data, selectedAgentId]
  );

  const label = loading
    ? "Loading…"
    : selectedAgent
    ? selectedAgent.name ?? "Unnamed worker"
    : agents.data.length
    ? "Select worker"
    : "No workers";

  return (
    <Flex flex="1" minW="0" justify="center" px="1">
      <Menu>
        <MenuButton
          as={Button}
          minW="0"
          maxW="280px"
          w="full"
          size="sm"
          variant="ghost"
          isLoading={loading}
          isDisabled={agents.data.length === 0}
          rightIcon={<Icon as={ChevronDownIcon} boxSize="16px" color="muted" />}
        >
          <Flex align="center" gap="2" minW="0" justify="center">
            {selectedAgent ? (
              <Box
                as="span"
                w="2"
                h="2"
                borderRadius="full"
                flexShrink={0}
                bg={
                  isWorkerReady(selectedAgent)
                    ? AGENT_STATUS_COLOR_MAP[AgentStatus.IDLE]
                    : AGENT_STATUS_COLOR_MAP[AgentStatus.RUNNING]
                }
              />
            ) : null}
            <Text noOfLines={1}>{label}</Text>
          </Flex>
        </MenuButton>
        <MenuList maxH="50vh" overflowY="auto" minW="240px">
          {loading ? (
            <MenuItem isDisabled pointerEvents="none">
              Loading workers…
            </MenuItem>
          ) : agents.data.length === 0 ? (
            <MenuItem isDisabled pointerEvents="none" color="muted">
              No workers connected
            </MenuItem>
          ) : (
            agents.data.map((agent) => (
              <AgentMenuItem
                key={agent._id}
                agent={agent}
                isSelected={agent._id === selectedAgentId}
                onSelect={() => setSelectedAgentId(agent._id)}
              />
            ))
          )}
        </MenuList>
      </Menu>
    </Flex>
  );
};

const AgentMenuItem = ({
  agent,
  isSelected,
  onSelect,
}: {
  agent: IAgent;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <MenuItem
    alignItems="flex-start"
    py={2}
    fontWeight={isSelected ? "semibold" : "normal"}
    onClick={onSelect}
  >
    <Flex align="flex-start" gap="2" w="full" minW={0}>
      <Box
        as="span"
        w="2"
        h="2"
        borderRadius="full"
        flexShrink={0}
        mt="6px"
        bg={
          isWorkerReady(agent)
            ? AGENT_STATUS_COLOR_MAP[AgentStatus.IDLE]
            : AGENT_STATUS_COLOR_MAP[AgentStatus.RUNNING]
        }
      />
      <VStack align="stretch" spacing={0.5} flex="1" minW={0}>
        <Text fontSize="sm" noOfLines={1}>
          {agent.name ?? "Unnamed worker"}
        </Text>
        {agent.contextPath ? (
          <Text
            fontSize="2xs"
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
    </Flex>
  </MenuItem>
);

export default AgentPicker;
