import { Box, Flex } from "@chakra-ui/react";
import { Composer, MessageList } from "@multiplayer-app/ai-agent-react";
import { memo } from "react";

import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

export const AgentSessionChatColumn = memo(function AgentSessionChatColumn() {
  const { isSandbox } = useProjectSandbox();

  return (
    <Flex
      minH="0"
      flex="1"
      flexDirection="column"
      minW="0"
      data-tour={isSandbox ? "mp-sandbox-agent-session" : undefined}
    >
      <Flex flex="1" minH="0">
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
});
