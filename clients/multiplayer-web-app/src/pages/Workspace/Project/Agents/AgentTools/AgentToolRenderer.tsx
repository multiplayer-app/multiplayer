import { MessageContent, MessageRole } from "@multiplayer-app/ai-agent-react";
import { Box, Flex, Text, ToolCard } from "./common";
import type { ToolRendererComponent } from "./common";

const SUBAGENT_LABELS: Record<string, [string, string]> = {
  Explore: ["Exploring", "Explored"],
};

const defaultLabels = (subagentType: string): [string, string] => [
  `Running ${subagentType}`,
  `Ran ${subagentType}`,
];

export const AgentToolRenderer: ToolRendererComponent = ({ call }) => {
  const description = (call.input?.description as string) ?? "";
  const subagentType = (call.input?.subagent_type as string) ?? "";
  const output = (call.output?.content as string) ?? "";
  const isDone = call.status === "succeeded" || call.status === "failed";
  const [activeLabel, doneLabel] =
    SUBAGENT_LABELS[subagentType] ?? defaultLabels(subagentType || "subagent");

  const verb = isDone ? doneLabel : activeLabel;
  const kindLabel = subagentType || "Agent";

  return (
    <ToolCard
      status={call.status}
      kindLabel={kindLabel}
      collapsible={!!output}
      hasBody={!!output}
      main={
        <Flex align="center" gap={2} minW={0}>
          <Text fontSize="xs" color="muted" minW={0} noOfLines={2}>
            <Text as="span" fontWeight="medium" color="body">
              {verb}
            </Text>
            {description ? ` — ${description}` : ""}
          </Text>
        </Flex>
      }
    >
      {output && <AgentToolContent output={output} />}
    </ToolCard>
  );
};

const AgentToolContent = ({ output }: { output: string }) => {
  return (
    <Box px={3} py={2}>
      <MessageContent role={MessageRole.Assistant} content={output} />
    </Box>
  );
};
