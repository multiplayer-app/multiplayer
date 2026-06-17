import {
  Box,
  Link,
  Text,
  Flex,
  VStack,
  HStack,
  Divider,
} from "@chakra-ui/react";
import type { ReactNode } from "react";

import Icon, { type IconProps } from "shared/components/Icon";
import MonoText from "shared/components/MonoText";
import TimeAgo from "shared/components/TimeAgo";

import { getAgentSessionDisplayTitle } from "../../AgentSessionInfo/AgentSessionInfo";
import {
  SESSION_STATUS_COLORS,
  SESSION_STATUS_LABELS,
} from "../../SessionTags/SessionTags";
import { IAgentChat } from "@multiplayer/types";

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      fontSize="10px"
      fontWeight="semibold"
      color="muted"
      textTransform="uppercase"
      letterSpacing="0.06em"
      mb="1"
    >
      {children}
    </Text>
  );
}

function OverviewRow({
  icon,
  label,
  children,
}: {
  icon: NonNullable<IconProps["name"]>;
  label: string;
  children: ReactNode;
}) {
  return (
    <HStack align="flex-start" gap="3" py="2.5" spacing="0">
      <Flex
        boxSize="9"
        flexShrink={0}
        align="center"
        justify="center"
        borderRadius="md"
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border.secondary"
      >
        <Icon name={icon} boxSize="4" color="muted" />
      </Flex>
      <Box minW={0} flex="1">
        <Text
          fontSize="xs"
          color="muted"
          fontWeight="medium"
          lineHeight="short"
        >
          {label}
        </Text>
        <Box mt="0.5">{children}</Box>
      </Box>
    </HStack>
  );
}

export default function SessionSidePanelOverviewTab({
  session,
}: {
  session: IAgentChat;
}) {
  const displayTitle = getAgentSessionDisplayTitle(session);
  const { prUrl, branchUrl, branchName, codeChanges } = session.git || {};
  const { additions = 0, deletions = 0 } = codeChanges || {};
  return (
    <VStack
      align="stretch"
      gap="0"
      p="4"
      pb="8"
      overflow="auto"
      h="full"
      spacing="0"
    >
      <Box>
        <SectionTitle>Session</SectionTitle>
        <OverviewRow icon="MessageSquareText" label="Name">
          <Text
            fontWeight="semibold"
            fontSize="sm"
            lineHeight="snug"
            wordBreak="break-word"
          >
            {displayTitle}
          </Text>
        </OverviewRow>
        <OverviewRow icon="CircleAlert" label="Status">
          <MonoText
            fontSize="xs"
            color={SESSION_STATUS_COLORS[session.status]?.color}
          >
            {SESSION_STATUS_LABELS[session.status] ?? session.status}
          </MonoText>
        </OverviewRow>

        <OverviewRow icon="Bot" label="Agent">
          <Text
            fontWeight="medium"
            fontSize="sm"
            lineHeight="snug"
            wordBreak="break-word"
          >
            {session.agentName || "Unknown"}
          </Text>
        </OverviewRow>
        <OverviewRow icon="Cpu" label="Model">
          <MonoText
            fontSize="xs"
            whiteSpace="normal"
            wordBreak="break-word"
            color="fg"
          >
            {session.model || "Unknown"}
          </MonoText>
        </OverviewRow>

        <OverviewRow icon="FolderOpen" label="Directory">
          <MonoText
            fontSize="xs"
            whiteSpace="normal"
            wordBreak="break-all"
            color="fg"
          >
            {session.dir || "Unknown"}
          </MonoText>
        </OverviewRow>

        {prUrl ? (
          <OverviewRow icon="GitPullRequest" label="Git pull request">
            <Link href={prUrl} isExternal maxW="full">
              <MonoText
                fontSize="xs"
                noOfLines={2}
                title={prUrl}
                color="inherit"
                whiteSpace="normal"
              >
                {prUrl}
              </MonoText>
            </Link>
          </OverviewRow>
        ) : null}
        {branchName ? (
          <OverviewRow icon="GitBranch" label="Git branch">
            <VStack align="flex-start" gap="1" spacing="0">
              {branchUrl ? (
                <Link href={branchUrl} isExternal maxW="full">
                  <MonoText
                    fontSize="xs"
                    noOfLines={2}
                    title={branchName}
                    color="inherit"
                    whiteSpace="normal"
                  >
                    {branchName}
                  </MonoText>
                </Link>
              ) : (
                <MonoText
                  fontSize="xs"
                  noOfLines={2}
                  title={branchName}
                  color="fg"
                  whiteSpace="normal"
                >
                  {branchName}
                </MonoText>
              )}
              {(additions > 0 || deletions > 0) && (
                <HStack gap="3" fontSize="xs">
                  {additions > 0 && (
                    <Text as="span" color="green.500" fontWeight="medium">
                      +{additions} lines added
                    </Text>
                  )}
                  {deletions > 0 && (
                    <Text as="span" color="red.400" fontWeight="medium">
                      -{deletions} lines removed
                    </Text>
                  )}
                </HStack>
              )}
            </VStack>
          </OverviewRow>
        ) : null}
      </Box>
      <Divider borderColor="border.primary" my="2" />
      <Box>
        <SectionTitle>Timeline</SectionTitle>
        <OverviewRow icon="CalendarPlus" label="Created">
          <Box fontSize="sm" color="fg">
            <TimeAgo date={session.createdAt} />
            <Text as="span" fontSize="xs" color="muted" ml="1.5">
              · {new Date(session.createdAt).toLocaleString()}
            </Text>
          </Box>
        </OverviewRow>
        <OverviewRow icon="Clock" label="Last updated">
          <Box fontSize="sm" color="fg">
            <TimeAgo date={session.updatedAt} />
            <Text as="span" fontSize="xs" color="muted" ml="1.5">
              · {new Date(session.updatedAt).toLocaleString()}
            </Text>
          </Box>
        </OverviewRow>
      </Box>
    </VStack>
  );
}
