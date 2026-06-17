import { Box, Code, ToolCard, editorHeight } from "./common";
import type { ToolRendererComponent } from "./common";
import { GitToolRenderer } from "./GitToolRenderer";

export const BashToolRenderer: ToolRendererComponent = (props) => {
  const { call } = props;
  const command = (call.input?.command as string) ?? "";
  const description = (call.input?.description as string) ?? "";
  const output = (call.output?.content as string) ?? "";
  const outputHeight = editorHeight(output);
  const normalizedCommand = command.trim().toLowerCase();
  const isGitCommand =
    normalizedCommand.startsWith("git ") || normalizedCommand.startsWith("gh ");

  if (isGitCommand) {
    return <GitToolRenderer {...props} />;
  }

  return (
    <ToolCard
      status={call.status}
      kindLabel="Run"
      collapsible={!!output}
      hasBody={!!output}
      tooltipLabel={command}
      name={description || command}
    >
      {output && (
        <Box
          h={`${outputHeight}px`}
          as={Code}
          px="3"
          py="2"
          w="100%"
          bg="inherit"
          fontSize="xs"
          fontFamily="mono"
          whiteSpace="pre-wrap"
        >
          {output}
        </Box>
      )}
    </ToolCard>
  );
};
