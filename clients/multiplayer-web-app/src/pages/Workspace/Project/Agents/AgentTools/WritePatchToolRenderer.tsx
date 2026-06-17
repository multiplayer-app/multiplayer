import {
  Badge,
  Box,
  Divider,
  Editor,
  EditIcon,
  Flex,
  Stack,
  Text,
  ToolCard,
  Tooltip,
  dirFromPath,
  editorHeight,
  editorOptions,
  extensionFromPath,
  filenameFromPath,
  getLanguageByExtension,
  lineCount,
  useColorMode,
  Collapse,
  ChevronDownIcon,
  ChevronRightIcon,
} from "./common";
import type { ToolRendererComponent } from "./common";
import { useState } from "react";

const PatchFileCard = ({
  filePath,
  newContent,
}: {
  filePath: string;
  newContent: string;
}) => {
  const [open, setOpen] = useState(false);
  const { colorMode } = useColorMode();

  const language = getLanguageByExtension(extensionFromPath(filePath));

  const lines = lineCount(newContent);
  const height = editorHeight(newContent);

  const dir = dirFromPath(filePath);
  const filename = filenameFromPath(filePath);
  const monacoTheme = colorMode === "dark" ? "vs-dark" : "light";

  return (
    <Box>
      <Flex
        px={3}
        py={2}
        align="center"
        gap={2}
        cursor="pointer"
        onClick={() => setOpen((v) => !v)}
        userSelect="none"
      >
        <EditIcon boxSize={3} color="yellow.500" flexShrink={0} />

        <Tooltip
          label={filePath}
          placement="top"
          openDelay={400}
          fontSize="xs"
          fontFamily="mono"
        >
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
              color="body"
              fontFamily="mono"
              fontWeight="medium"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {filename}
            </Text>
          </Flex>
        </Tooltip>

        <Flex ml="auto" align="center" gap={2} flexShrink={0}>
          <Text fontSize="xs" color="muted">
            {lines} {lines === 1 ? "line" : "lines"}
          </Text>
          {open ? (
            <ChevronDownIcon boxSize={4} color="muted" />
          ) : (
            <ChevronRightIcon boxSize={4} color="muted" />
          )}
        </Flex>
      </Flex>

      <Collapse in={open} animateOpacity unmountOnExit>
        <Box h={`${height}px`}>
          <Editor
            height="100%"
            language={language}
            value={newContent}
            options={editorOptions}
            theme={monacoTheme}
          />
        </Box>
      </Collapse>
    </Box>
  );
};

export const WritePatchToolRenderer: ToolRendererComponent = ({ call }) => {
  const patches =
    (call.input?.patches as Array<{ filePath: string; newContent: string }>) ??
    [];
  const summary = (call.output?.content as string) ?? "";

  return (
    <ToolCard
      status={call.status}

      kindLabel="Apply"
      hasBody={!!summary || patches.length > 0}
      main={
        <Text fontSize="sm" fontWeight="semibold" color="surface">
          Apply patches
        </Text>
      }
      metaRight={
        patches.length > 0 ? (
          <Badge
            variant="surface"
            colorScheme="yellow"
            fontSize="2xs"
            borderRadius="full"
          >
            {patches.length} {patches.length === 1 ? "file" : "files"}
          </Badge>
        ) : null
      }
    >
      <>
        {summary && (
          <Box px={3} pb={1}>
            <Text fontSize="xs" color="muted">
              {summary}
            </Text>
          </Box>
        )}

        {patches.length > 0 && (
          <>
            <Divider borderColor="border.primary" />
            <Stack
              spacing={0}
              divider={<Divider borderColor="border.primary" />}
            >
              {patches.map((patch) => (
                <PatchFileCard
                  key={patch.filePath}
                  filePath={patch.filePath}
                  newContent={patch.newContent}
                />
              ))}
            </Stack>
          </>
        )}
      </>
    </ToolCard>
  );
};
