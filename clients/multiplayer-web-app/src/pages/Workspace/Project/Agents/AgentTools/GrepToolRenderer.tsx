import { Box, ToolCard, editorHeight, Code } from "./common";
import type { ToolRendererComponent } from "./common";

export const GrepToolRenderer: ToolRendererComponent = ({ call }) => {
  const pattern = (call.input?.pattern as string) ?? "";
  const output = (call.output?.content as string) ?? "";
  const height = editorHeight(output);

  return (
    <ToolCard
      status={call.status}
      kindLabel="Grep"
      name={pattern}
      collapsible={!!output}
      hasBody={!!output}
    >
      {output && (
        <Box h={`${height}px`} px={3} py={2} overflow="auto" >
          <Code bg="transparent" fontSize="xs" whiteSpace="pre-wrap">{output}</Code>
        </Box>
      )}
    </ToolCard>
  );
};
