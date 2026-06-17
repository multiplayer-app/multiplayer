import {
  Box,
  Editor,
  Text,
  ToolCard,
  editorHeight,
  editorOptions,
  extensionFromPath,
  filenameFromPath,
  getLanguageByExtension,
  lineCount,
  stripReadOutput,
  useColorMode,
} from "./common";
import type { ToolRendererComponent } from "./common";

export const ReadToolRenderer: ToolRendererComponent = ({ call }) => {
  const filePath = (call.input?.file_path as string) ?? "";
  const rawContent = (call.output?.content as string) ?? "";
  const content = stripReadOutput(rawContent);
  const isError = call.status === "failed" || content.startsWith("Error:");
  const isDirectory = content.startsWith("Directory contents:");
  const { colorMode } = useColorMode();

  const language = getLanguageByExtension(extensionFromPath(filePath));

  const lines = lineCount(content);
  const height = editorHeight(content);
  const monacoTheme = colorMode === "dark" ? "vs-dark" : "light";

  return (
    <ToolCard
      status={call.status}
      kindLabel="Read"
      name={filePath}
      nameProcessor={filenameFromPath}
      collapsible={!!content}
      hasBody={!!content}
      metaRight={
        !isError && !isDirectory && lines > 0 ? (
          <Text fontSize="xs" color="muted" flexShrink={0} whiteSpace="nowrap">
            {lines} {lines === 1 ? "line" : "lines"}
          </Text>
        ) : null
      }
    >
      {isDirectory ? (
        <Box px={3} py={2}>
          <Text
            fontSize="xs"
            whiteSpace="pre-wrap"
            fontFamily="mono"
            color="body"
          >
            {content}
          </Text>
        </Box>
      ) : isError ? (
        <Box px={3} py={2}>
          <Text
            fontSize="xs"
            whiteSpace="pre-wrap"
            fontFamily="mono"
            color="m.red"
          >
            {content}
          </Text>
        </Box>
      ) : (
        <Box h={`${height}px`}>
          <Editor
            height="100%"
            language={language}
            value={content}
            options={editorOptions}
            theme={monacoTheme}
          />
        </Box>
      )}
    </ToolCard>
  );
};
