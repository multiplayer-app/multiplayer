import { Flex, Text } from "@chakra-ui/react";
import { IAgentChat } from "@multiplayer/types";
import Icon from "shared/components/Icon";

export const SessionGitInfo = ({ git }: Partial<IAgentChat>) => {
  const branchName = git?.branchName;
  const additions = git?.codeChanges?.additions;
  const deletions = git?.codeChanges?.deletions;

  if (branchName) {
    return (
      <Flex
        align="center"
        gap="1.5"
        fontSize="xs"
        color="muted"
        fontFamily="mono"
      >
        <Flex align="center" gap="1" minW={0}>
          <Icon name="GitBranch" boxSize="3" />
          <Text noOfLines={1} title={branchName}>
            {branchName}
          </Text>
        </Flex>
        {(typeof additions === "number" || typeof deletions === "number") && (
          <Flex as="span" gap="1" whiteSpace="nowrap">
            {typeof additions === "number" && (
              <Text as="span" color="green.400">
                +{additions}
              </Text>
            )}
            {typeof deletions === "number" && (
              <Text as="span" color="red.400">
                -{deletions}
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    );
  }

  return null;
};

export default SessionGitInfo;
