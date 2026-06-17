import {
  Box,
  Editor,
  Flex,
  Text,
  ToolCard,
  lineCount,
  editorHeight,
  dirFromPath,
  useColorMode,
  editorOptions,
  extensionFromPath,
  filenameFromPath,
  getLanguageByExtension,
} from "./common";
import type { ToolRendererComponent } from "./common";

export const ReadFileToolRenderer: ToolRendererComponent = ({ call }) => {
  const filePath = (call.input?.path as string) ?? "";
  const content = (call.output?.content as string) ?? "";
  const isError = call.status === "failed" || content.startsWith("Error:");
  const isDirectory = content.startsWith("Directory contents:");
  const { colorMode } = useColorMode();

  const language = getLanguageByExtension(extensionFromPath(filePath));

  const lines = lineCount(content);
  const height = editorHeight(content);

  const dir = dirFromPath(filePath);
  const filename = filenameFromPath(filePath);
  const monacoTheme = colorMode === "dark" ? "vs-dark" : "light";

  return (
    <ToolCard
      status={call.status}
      kindLabel="Read"
      name={filePath}
      nameProcessor={filenameFromPath}
      collapsible={!!content}
      hasBody={!!content}
      main={
        <Flex align="baseline" gap={0} minW={0} overflow="hidden">
          {dir && (
            <Text
              fontSize="xs"
              color="muted"
              fontFamily="mono"
              whiteSpace="nowrap"
            >
              {dir}
            </Text>
          )}
          <Text
            fontSize="xs"
            color="surface"
            fontFamily="mono"
            fontWeight="medium"
            whiteSpace="nowrap"
          >
            {filename}
          </Text>
        </Flex>
      }
      metaRight={
        !isError && !isDirectory && lines > 0 ? (
          <Text fontSize="xs" color="muted">
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
        <Box px={3} py={2} >
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
