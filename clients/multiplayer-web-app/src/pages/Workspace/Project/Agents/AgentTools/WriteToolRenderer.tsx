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
  useColorMode,
} from "./common";
import type { ToolRendererComponent } from "./common";

export const WriteToolRenderer: ToolRendererComponent = ({ call }) => {
  const filePath = (call.input?.file_path as string) ?? "";
  const written = (call.input?.content as string) ?? "";
  const result = (call.output?.content as string) ?? "";
  const failed = call.status === "failed";
  const body = failed ? result || written : written || result;
  const isError =
    failed || result.startsWith("Error") || body.startsWith("Error");
  const { colorMode } = useColorMode();
  const language = getLanguageByExtension(extensionFromPath(filePath));
  const lines = lineCount(body);
  const height = editorHeight(body);
  const monacoTheme = colorMode === "dark" ? "vs-dark" : "light";

  return (
    <ToolCard
      status={call.status}
      kindLabel="Write"
      name={filePath}
      nameProcessor={filenameFromPath}
      collapsible={!!body}
      hasBody={!!body}
      metaRight={
        !isError && lines > 0 ? (
          <Text fontSize="xs" color="muted" flexShrink={0} whiteSpace="nowrap">
            {lines} {lines === 1 ? "line" : "lines"}
          </Text>
        ) : null
      }
    >
      {isError ? (
        <Box px={3} py={2}>
          <Text
            fontSize="xs"
            whiteSpace="pre-wrap"
            fontFamily="mono"
            color="m.red"
          >
            {body}
          </Text>
        </Box>
      ) : (
        <Box h={`${height}px`}>
          <Editor
            height="100%"
            language={language}
            value={body}
            options={editorOptions}
            theme={monacoTheme}
          />
        </Box>
      )}
    </ToolCard>
  );
};
