import { useEffect } from "react";
import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import {
  Composer,
  MessageList,
  useAgentStore,
  useEnsureActiveChat,
} from "@multiplayer-app/ai-agent-react";

import PageLoading from "shared/components/PageLoading";
import EmptyScreen from "shared/components/EmptyScreen";
import Icon from "shared/components/Icon";
import CheckAccess from "shared/components/CheckAccess";
import { useAgents } from "shared/providers/AgentRuntimeContext";
import { usePanelChat } from "../context/panelContext";
import CliInstallCommandBox from "shared/components/CliInstallCommandBox/CliInstallCommandBox";

const Content = () => {
  const { agents, loading: agentsLoading } = useAgents();
  const hasWorkers = agents.data.length > 0;
  const { activeSessionId, createSession, selectedAgentId } = usePanelChat();
  const setActiveChat = useAgentStore((s) => s.setActiveChat);
  const isChatHistoryOpen = useAgentStore((s) => s.isChatHistoryOpen);
  const setChatHistoryOpen = useAgentStore((s) => s.setChatHistoryOpen);
  const { isLoading, data: session } = useEnsureActiveChat();

  useEffect(() => {
    setActiveChat(activeSessionId);
    return () => {
      setActiveChat(null);
    };
  }, [activeSessionId, setActiveChat]);

  if (!activeSessionId) {
    const emptyState = agentsLoading
      ? {
          title: "Loading workers…",
          description: "Checking for connected workers.",
          iconName: "Bot" as const,
        }
      : !hasWorkers
      ? {
          title: "No workers connected",
          description: (
            <>
              <Text mb="2">
                Start a debugging agent on your machine to use chat. <br />
                Copy/paste the command below in your terminal, and you&apos;re
                done.
              </Text>
              <CliInstallCommandBox />
            </>
          ),
          iconName: "BotOff" as const,
        }
      : {
          title: "Select a chat",
          description: "Pick a session from the list or start a new one.",
          iconName: "Bot" as const,
        };

    return (
      <EmptyScreen
        flex="1"
        minH="0"
        px="4"
        py="6"
        title={emptyState.title}
        description={emptyState.description}
        icon={
          <Flex
            align="center"
            justify="center"
            w="12"
            h="12"
            mb="2"
            borderRadius="xl"
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.secondary"
          >
            <Icon name={emptyState.iconName} boxSize="24px" color="muted" />
          </Flex>
        }
      >
        {hasWorkers && !agentsLoading ? (
          <HStack spacing="2" mt="1">
            <CheckAccess
              scope={RoleType.PROJECT}
              permission={RoleAccessAction.CREATE}
              entity={RoleProjectPermissionEntity.AGENT_CHAT}
            >
              <Button
                size="sm"
                leftIcon={<Icon name="SquarePen" boxSize="16px" />}
                isDisabled={!selectedAgentId}
                onClick={() => void createSession()}
              >
                New chat
              </Button>
            </CheckAccess>
            {!isChatHistoryOpen ? (
              <Button
                size="sm"
                variant="light"
                leftIcon={<Icon name="PanelLeft" boxSize="16px" />}
                onClick={() => setChatHistoryOpen(true)}
              >
                Browse chats
              </Button>
            ) : null}
          </HStack>
        ) : !agentsLoading ? (
          <Button
            size="sm"
            variant="light"
            mt="1"
            leftIcon={<Icon name="PanelLeft" boxSize="16px" />}
            onClick={() => setChatHistoryOpen(true)}
          >
            Browse chats
          </Button>
        ) : null}
      </EmptyScreen>
    );
  }

  if (isLoading) return <PageLoading />;

  if (!session) {
    return (
      <Flex flex="1" minH="0" align="center" justify="center" px="4" py="6">
        <Text fontSize="sm" color="muted" textAlign="center">
          Session not found. Re-open it from the sessions list.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex flex="1" minH="0" minW="0" direction="column" overflow="hidden">
      <Flex flex="1" minH="0" minW="0" direction="column" overflow="hidden">
        <MessageList />
      </Flex>
      <Box
        flexShrink={0}
        borderTopWidth="1px"
        borderColor="border.primary"
        __css={{
          ".mp-agent-composer-wrapper": {
            background: "none",
          },
        }}
      >
        <Composer autoFocus={false} />
      </Box>
    </Flex>
  );
};

export default Content;
