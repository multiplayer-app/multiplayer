import { useMemo } from "react";
import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import { format } from "date-fns";
import { IAgentChat } from "@multiplayer/types";
import { useAgentStore } from "@multiplayer-app/ai-agent-react";

import { useAgentSessions } from "pages/Workspace/Project/Agents/AgentSessionsContext";
import { getAgentSessionDisplayTitle } from "pages/Workspace/Project/Agents/AgentSessionInfo/AgentSessionInfo";
import { usePanelChat } from "../context/panelContext";

const CHAT_HISTORY_WIDTH = 200;

function formatSessionTime(dateStr: string | Date | undefined) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM d, h:mm a");
}

const SessionsSidebar = () => {
  const isOpen = useAgentStore((s) => s.isChatHistoryOpen);
  const { sessions, loading } = useAgentSessions();
  const { activeSessionId, setActiveSessionId } = usePanelChat();

  const items = useMemo(
    () => (sessions.data ?? []) as IAgentChat[],
    [sessions.data]
  );

  if (!isOpen) return null;

  return (
    <Flex
      direction="column"
      h="full"
      w={`${CHAT_HISTORY_WIDTH}px`}
      flexShrink={0}
      borderRightWidth="1px"
      borderColor="border.primary"
      bg="bg.primary"
      position="absolute"
      top="0"
      left="0"
      bottom="0"
      sx={{
        "@container (min-width: 768px)": {
          position: "relative",
          top: "auto",
          left: "auto",
          bottom: "auto",
        },
      }}
    >
      <Box px="4" pt="2" pb="2" flexShrink={0}>
        <Text fontSize="13px" fontWeight="semibold" color="muted">
          Chats
        </Text>
      </Box>

      <Box flex="1" minH="0" overflowY="auto" px="2" pb="2">
        {loading && !items.length ? (
          <Flex justify="center" py="2">
            <Spinner size="sm" />
          </Flex>
        ) : !items.length ? (
          <Text px="2" py="2" fontSize="xs" color="muted" opacity={0.6}>
            No chats yet
          </Text>
        ) : (
          <VStack align="stretch" spacing="1">
            {items.map((session) => {
              const id = session._id;
              const isActive = id === activeSessionId;
              return (
                <Box
                  key={id}
                  as="button"
                  type="button"
                  w="full"
                  textAlign="left"
                  px="2"
                  py="1.5"
                  borderRadius="md"
                  transition="background 0.15s ease, color 0.15s ease"
                  bg={isActive ? "bg.subtle" : "transparent"}
                  _hover={{
                    bg: isActive ? "bg.subtle" : "bg.muted",
                  }}
                  onClick={() => setActiveSessionId(id)}
                >
                  <Text
                    fontSize="xs"
                    fontWeight={isActive ? "semibold" : "medium"}
                    color="fg"
                    noOfLines={1}
                    lineHeight="short"
                  >
                    {getAgentSessionDisplayTitle(session)}
                  </Text>
                  {session.updatedAt ? (
                    <Text
                      fontSize="10px"
                      color="muted"
                      opacity={isActive ? 0.8 : 0.6}
                      mt="0.5"
                      noOfLines={1}
                    >
                      {formatSessionTime(session.updatedAt)}
                    </Text>
                  ) : null}
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
    </Flex>
  );
};

export { CHAT_HISTORY_WIDTH };
export default SessionsSidebar;
