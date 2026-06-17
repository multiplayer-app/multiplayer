import { InfoIcon } from "@chakra-ui/icons";
import { Box, Flex, HStack, Icon, VStack } from "@chakra-ui/react";
import { TimeIcon } from "shared/icons";

import { IS_VSCODE } from "vscode/VsCodeContext";
import TimeAgo from "shared/components/TimeAgo";
import IssueInfo from "shared/components/IssueInfo";
import Visibility from "shared/components/Visibility";
import { useIssue } from "shared/providers/IssueContext";

import IssueResolver from "../IssueResolver";
import { useIssueEmbedded } from "../IssueEmbeddedContext";
import { SeverityToggle } from "../../Severity";
import IssueFixability from "./IssueFixability";

const IssueHeader = () => {
  const { updateIssue, issue } = useIssue();
  const embedded = useIssueEmbedded();
  if (!issue) return null;

  return (
    <Flex gap="4" direction={{ base: "column", md: "row" }}>
      <HStack gap="4" flex="1" minW="0">
        <Visibility hideBelow="md">
          <Box
            p="4"
            bg="red.100"
            boxSize="16"
            color="red.500"
            borderRadius="2xl"
          >
            <Icon as={InfoIcon} boxSize="8" />
          </Box>
        </Visibility>
        <VStack
          gap="2"
          flex="1"
          minW="0"
          align="flex-start"
          fontWeight="medium"
        >
          <IssueInfo w="full" issue={issue} gap="2" py="0" />
          <HStack color="muted" gap="4">
            <HStack gap="2" fontSize="xs">
              <Icon as={TimeIcon} />
              <TimeAgo date={issue.createdAt} />
            </HStack>
            <SeverityToggle
              value={issue.severity}
              onChange={(severity) => {
                updateIssue({ severity });
              }}
            />
          </HStack>
        </VStack>
      </HStack>
      {!embedded && (
        <Flex ml="auto" alignItems="center" gap="2">
          {!IS_VSCODE && !issue.resolved && <IssueFixability />}
          <IssueResolver />
        </Flex>
      )}
    </Flex>
  );
};

export default IssueHeader;
