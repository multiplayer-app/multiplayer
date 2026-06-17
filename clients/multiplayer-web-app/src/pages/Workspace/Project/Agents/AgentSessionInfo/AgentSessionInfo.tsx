import { Text, VStack, type StackProps } from "@chakra-ui/react";

import SessionGitInfo from "./SessionGitInfo";
import SessionModelInfo from "./SessionModelInfo";
import { IAgentChat } from "@multiplayer/types";

export function getAgentSessionDisplayTitle(session: IAgentChat): string {
  const title = session?.title;
  if (title) return String(title);
  const id = String(session?._id);
  return id ? `Session #${id.slice(-6)}` : "Session";
}

export type AgentSessionInfoProps = {
  session: IAgentChat;
  titleVariant?: "table" | "header";
} & Omit<StackProps, "align" | "children">;

export const AgentSessionInfo = ({
  session,
  titleVariant = "table",
  ...stackProps
}: AgentSessionInfoProps) => {
  const isTable = titleVariant === "table";

  return (
    <VStack align="flex-start" gap="0.5" w="full" minW={0} {...stackProps}>
      <Text
        noOfLines={1}
        fontSize={isTable ? "sm" : undefined}
        fontWeight={isTable ? "500" : "semibold"}
      >
        {getAgentSessionDisplayTitle(session)}
      </Text>
      <SessionGitInfo git={session.git} />
      <SessionModelInfo model={session.model} />
    </VStack>
  );
};

export default AgentSessionInfo;
