import { Box, Flex, Icon, Text } from "@chakra-ui/react";

import {
  useAgentStore,
  useEnsureActiveChat,
} from "@multiplayer-app/ai-agent-react";
import { useEffect, type ReactNode } from "react";

import { CopilotIcon } from "shared/icons";
import EmptyScreen from "shared/components/EmptyScreen";
import PageLoading from "shared/components/PageLoading";
import Toolbar, { ToolbarButton } from "shared/components/Toolbar";
import IconLucide from "shared/components/Icon";

import { getAgentSessionDisplayTitle } from "../AgentSessionInfo/AgentSessionInfo";
import { SessionStatusTag } from "../SessionTags/SessionTags";

import { useAgentSessionSidePanel } from "./AgentSessionSidePanel/useAgentSessionSidePanel";
import { AgentSessionDetailsShell } from "./AgentSessionDetailsShell";
import { IAgentChat } from "@multiplayer/types";

type AgentDetailsProps = {
  sessionId?: string | null;
  isPreviewMode?: boolean;
  /** Shown in the toolbar before the session-details toggle (e.g. preview drawer actions). */
  toolbarExtraRight?: ReactNode;
};

const AgentDetails = ({
  sessionId,
  isPreviewMode = false,
  toolbarExtraRight,
}: AgentDetailsProps) => {
  const { isLoading: loading, data: session } = useEnsureActiveChat();
  const setActiveChat = useAgentStore((s) => s.setActiveChat);

  const panel = useAgentSessionSidePanel({
    enabled: Boolean(sessionId),
    defaultOpen: !isPreviewMode,
  });

  useEffect(() => {
    setActiveChat(sessionId);
    return () => {
      setActiveChat(null);
    };
  }, [sessionId, setActiveChat]);

  if (!sessionId) {
    return (
      <EmptyScreen
        my="12"
        title="Runner not selected"
        description="Select a session from the list to open its runner."
        icon={<Icon as={CopilotIcon} color="brand.500" boxSize="12" />}
      />
    );
  }

  if (loading) return <PageLoading />;

  if (!session) {
    return (
      <EmptyScreen
        my="12"
        title="Session not found"
        icon={<Icon as={CopilotIcon} color="brand.500" boxSize="12" />}
        description="Session data is missing. Re-open the session from the sessions table."
      />
    );
  }
  const chatSession = session as unknown as IAgentChat;
  return (
    <Flex direction="column" flex="1" minH="0">
      <Toolbar
        width="100%"
        leftContent={
          <Flex align="center" gap="2" minW="0" flex="1">
            <Box flexShrink={0}>
              <SessionStatusTag status={chatSession.status} />
            </Box>
            <Text
              fontWeight="semibold"
              fontSize="sm"
              noOfLines={1}
              minW="0"
              flex="1"
            >
              {getAgentSessionDisplayTitle(chatSession)}
            </Text>
          </Flex>
        }
        rightContent={
          <>
            <ToolbarButton
              aria-expanded={panel.sidePanelOpen}
              command={panel.toggleShortcutLabel}
              onClick={panel.toggleSidePanel}
              icon={
                <IconLucide
                  name={
                    panel.sidePanelOpen ? "PanelRightClose" : "PanelRightOpen"
                  }
                />
              }
              label={
                panel.sidePanelOpen
                  ? "Hide session details"
                  : "Show session details"
              }
            />
            {toolbarExtraRight}
          </>
        }
      />
      <AgentSessionDetailsShell
        panel={panel}
        session={chatSession}
        forceOverlayLayout={isPreviewMode}
      />
    </Flex>
  );
};

export default AgentDetails;
