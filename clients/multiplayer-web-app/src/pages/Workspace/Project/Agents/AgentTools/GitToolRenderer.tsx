import { memo } from "react";
import {
  Badge,
  Box,
  Code,
  Flex,
  Link,
  Text,
  ToolCard,
  editorHeight,
} from "./common";
import type { ToolRendererComponent } from "./common";

/** Recognize git subcommands when they appear after && / ; / ||, not only at command start. */
const commandHasGitSubcommand = (command: string, sub: string): boolean => {
  const re = new RegExp(`^git\\s+${sub}\\b`);
  return command
    .split(/&&|;|\|\|/)
    .map((c) => c.trim())
    .some((clause) => re.test(clause));
};

const inferOperationFromNameOrCommand = (
  name: string,
  command: string
): string => {
  if (name === "git_status" || commandHasGitSubcommand(command, "status"))
    return "status";
  if (name === "git_commit" || commandHasGitSubcommand(command, "commit"))
    return "commit";
  if (name === "git_push" || commandHasGitSubcommand(command, "push"))
    return "push";
  if (
    name === "git_create_pr" ||
    command.includes("gh pr create") ||
    command.includes("gitlab mr create")
  ) {
    return "create_pr";
  }
  return "git";
};

const operationLabel = (operation: string): string => {
  switch (operation) {
    case "status":
      return "Status";
    case "commit":
      return "Commit";
    case "push":
      return "Push";
    case "create_pr":
      return "Create PR";
    default:
      return "Git";
  }
};

export const GitToolRenderer = memo(({ call }) => {
  const toolName = ((call as any).name as string) ?? "";
  const command = (call.input?.command as string) ?? "";
  const outputContent = (call.output?.content as string) ?? "";
  const outputRaw = (call.output?.raw as string) ?? "";
  const branch =
    (call.output?.branch as string) ?? (call.input?.branch as string) ?? "";
  const prUrl = (call.output?.prUrl as string) ?? "";
  const commitSha = (call.output?.commitSha as string) ?? "";
  const operation =
    (call.output?.operation as string) ||
    inferOperationFromNameOrCommand(toolName, command);
  const label = operationLabel(operation);
  const raw = outputRaw || outputContent;
  const height = editorHeight(raw);

  return (
    <ToolCard
      status={call.status}
      kindLabel="Git"
      name={command || label}
      tooltipLabel={command || label}
      collapsible={!!raw}
      hasBody={!!raw || !!prUrl}
      main={
        <Flex align="center" gap={2} flexShrink={0} minW={0}>
          <Text fontSize="xs" color="body" fontWeight="semibold">
            {label}
          </Text>
          {branch ? (
            <Badge variant="surface" fontSize="2xs" borderRadius="full">
              {branch}
            </Badge>
          ) : null}
          {commitSha ? (
            <Badge variant="subtle" fontSize="2xs" borderRadius="full">
              {commitSha.slice(0, 7)}
            </Badge>
          ) : null}
        </Flex>
      }
    >
      <Box px={3} py={2}>
        {prUrl ? (
          <Text fontSize="xs" mb={raw ? 2 : 0}>
            PR:{" "}
            <Link href={prUrl} color="m.blue" isExternal>
              {prUrl}
            </Link>
          </Text>
        ) : null}
        {raw ? (
          <Box
            h={`${height}px`}
            as={Code}
            px="2"
            py="1.5"
            w="100%"
            bg="inherit"
            fontSize="xs"
            fontFamily="mono"
            whiteSpace="pre-wrap"
            overflow="auto"
          >
            {raw}
          </Box>
        ) : null}
      </Box>
    </ToolCard>
  );
}) as ToolRendererComponent;
