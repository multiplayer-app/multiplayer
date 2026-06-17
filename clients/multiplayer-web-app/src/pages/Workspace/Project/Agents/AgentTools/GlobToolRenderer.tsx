import { Box, ToolCard, editorHeight, Code, Text } from "./common";
import type { ToolRendererComponent } from "./common";

export const GlobToolRenderer: ToolRendererComponent = ({ call }) => {
  const pattern = (call.input?.pattern as string) ?? "";
  const output = (call.output?.content as string) ?? "";
  const height = editorHeight(output);
  const matchCount = output.trim()
    ? output.trim().split("\n").filter(Boolean).length
    : 0;

  return (
    <ToolCard
      status={call.status}
      kindLabel="Glob"
      name={pattern}
      collapsible={!!output}
      hasBody={!!output}
      metaRight={
        matchCount > 0 ? (
          <Text fontSize="xs" color="muted" flexShrink={0} whiteSpace="nowrap">
            {matchCount} {matchCount === 1 ? "match" : "matches"}
          </Text>
        ) : null
      }
    >
      {output && (
        <Box h={`${height}px`} px={3} py={2} overflow="auto">
          <Code bg="transparent" fontSize="xs" whiteSpace="pre-wrap">
            {output}
          </Code>
        </Box>
      )}
    </ToolCard>
  );
};
