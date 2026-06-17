import { Flex, IconButton, Tooltip } from "@chakra-ui/react";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import { useAgentStore } from "@multiplayer-app/ai-agent-react";

import Icon from "shared/components/Icon";
import CheckAccess from "shared/components/CheckAccess";
import AgentPicker from "./AgentPicker";
import { usePanelChat } from "../context/panelContext";

const DrawerHeader = () => {
  const isChatHistoryOpen = useAgentStore((s) => s.isChatHistoryOpen);
  const toggleChatHistory = useAgentStore((s) => s.toggleChatHistory);
  const {
    activeSessionId,
    createSession,
    closePanel,
    openInPageView,
    selectedAgentId,
  } = usePanelChat();

  return (
    <Flex
      align="center"
      justify="space-between"
      gap="4"
      px="2"
      py="2"
      flexShrink={0}
      borderBottomWidth="1px"
      borderColor="border.primary"
      bg="bg.primary"
    >
      <Flex align="center" gap="2" flexShrink={0}>
        <IconButton
          size="sm"
          variant="ghost"
          aria-label={isChatHistoryOpen ? "Hide chats" : "Show chats"}
          icon={
            <Icon
              name={isChatHistoryOpen ? "PanelLeftClose" : "PanelLeft"}
              boxSize="18px"
            />
          }
          onClick={toggleChatHistory}
        />
        <CheckAccess
          scope={RoleType.PROJECT}
          permission={RoleAccessAction.CREATE}
          entity={RoleProjectPermissionEntity.AGENT_CHAT}
        >
          <Tooltip
            label={
              !selectedAgentId
                ? "Select a worker before creating a chat"
                : undefined
            }
            isDisabled={Boolean(selectedAgentId)}
          >
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="New chat"
              icon={<Icon name="SquarePen" boxSize="18px" />}
              isDisabled={!selectedAgentId}
              onClick={() => void createSession()}
            />
          </Tooltip>
        </CheckAccess>
      </Flex>
      <AgentPicker />
      <Flex align="center" gap="2" flexShrink={0}>
        {activeSessionId ? (
          <Tooltip label="Open in page view">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Open in page view"
              icon={<Icon name="SquareArrowOutUpLeft" boxSize="18px" />}
              onClick={openInPageView}
            />
          </Tooltip>
        ) : null}
        <IconButton
          size="sm"
          variant="ghost"
          aria-label="Close chat"
          icon={<Icon name="X" boxSize="18px" />}
          onClick={closePanel}
        />
      </Flex>
    </Flex>
  );
};

export default DrawerHeader;
