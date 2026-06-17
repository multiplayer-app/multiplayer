import { memo } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { IIssue } from "@multiplayer/types";

import EmptyScreen from "shared/components/EmptyScreen";
import PageLoading from "shared/components/PageLoading";
import { IssueHostInfo } from "shared/components/IssueInfo";
import IssueServiceInfo from "shared/components/IssueInfo/IssueServiceInfo";

interface IssueComponentListProps {
  issues: IIssue[];
  loading: boolean;
  selectedComponentHash?: string | null;

  onSelect: (componentHash: string) => void;
}

const IssueComponentList = memo(
  ({
    issues,
    loading,
    selectedComponentHash,

    onSelect,
  }: IssueComponentListProps) => {
    return (
      <Flex
        w="400px"
        minW="400px"
        maxW="400px"
        direction="column"
        borderRight="1px solid"
        borderColor="border.primary"
        overflow="hidden"
      >
        <Box
          px="2"
          py="3"
          borderBottom="1px solid"
          borderColor="border.primary"
        >
          <Text fontSize="sm" fontWeight="medium" color="muted">
            Issues
          </Text>
        </Box>
        <Box flex="1" overflowY="auto">
          {loading && issues.length === 0 ? (
            <PageLoading />
          ) : issues.length === 0 ? (
            <EmptyScreen
              title="No issues"
              description="No issues reported for this group."
            />
          ) : (
            <VStack align="stretch" spacing="0">
              {issues.map((issue) => (
                <ComponentRow
                  key={issue.componentHash || issue._id}
                  issue={issue}
                  selected={issue.componentHash === selectedComponentHash}
                  onSelect={onSelect}
                />
              ))}
            </VStack>
          )}
        </Box>
      </Flex>
    );
  }
);

interface ComponentRowProps {
  issue: IIssue;
  selected: boolean;
  onSelect: (componentHash: string) => void;
}

const ComponentRow = ({ issue, selected, onSelect }: ComponentRowProps) => {
  return (
    <Flex
      direction="column"
      px="2"
      py="3"
      w="full"
      cursor="pointer"
      borderBottom="1px solid"
      borderColor="border.primary"
      bg={selected ? "bg.subtle" : "transparent"}
      _hover={{ bg: selected ? "bg.subtle" : "bg.muted" }}
      onClick={() => issue.componentHash && onSelect(issue.componentHash)}
    >
      <IssueServiceInfo service={issue.service} />
      <IssueHostInfo metadata={issue.metadata} />
    </Flex>
  );
};

export default IssueComponentList;
