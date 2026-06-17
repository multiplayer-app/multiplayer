import { Flex, useEventListener } from "@chakra-ui/react";
import { useAgentStore } from "@multiplayer-app/ai-agent-react";

import PushDrawer from "shared/components/PushDrawer";

import DrawerHeader from "./DrawerHeader";
import SessionsSidebar, { CHAT_HISTORY_WIDTH } from "./SessionsSidebar";
import Content from "./Content";
import { usePanelChat } from "../context/panelContext";
import { useAgentsPage } from "../context/useAgentsPage";

const CHAT_PANEL_WIDTH = 560;

const ChatPanel = () => {
  const { isOpen, closePanel } = usePanelChat();
  const isChatHistoryOpen = useAgentStore((s) => s.isChatHistoryOpen);
  const isAgentsPage = useAgentsPage();

  useEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") {
      closePanel();
    }
  });

  if (!isOpen || isAgentsPage) return null;

  return (
    <PushDrawer w={CHAT_PANEL_WIDTH}>
      <Flex h="full" minH="0" overflow="hidden" position="relative">
        <SessionsSidebar />
        <Flex
          flex="1"
          minH="0"
          minW="0"
          h="full"
          direction="column"
          overflow="hidden"
          position="relative"
          zIndex={1}
          bg="bg.primary"
          transition="transform 0.2s ease-in-out"
          transform={
            isChatHistoryOpen
              ? `translateX(${CHAT_HISTORY_WIDTH}px)`
              : undefined
          }
          boxShadow={
            isChatHistoryOpen ? "0 0 10px rgba(0, 0, 0, 0.1)" : undefined
          }
          sx={{
            "@container (min-width: 768px)": {
              transform: "none",
              boxShadow: "none",
            },
          }}
        >
          <DrawerHeader />
          <Content />
        </Flex>
      </Flex>
    </PushDrawer>
  );
};

export default ChatPanel;
