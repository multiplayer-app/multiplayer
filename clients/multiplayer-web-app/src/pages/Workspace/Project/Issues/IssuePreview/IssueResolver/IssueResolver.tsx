import { HStack, Button, Icon, Text, Flex } from "@chakra-ui/react";
import { ArchiveIcon, CheckCircleIcon } from "shared/icons";
import { useIssue } from "shared/providers/IssueContext";

const IssueResolver = () => {
  const { issue, updateIssue } = useIssue();
  if (!issue) return null;

  const handleResolve = () => {
    if (issue.resolved) {
      updateIssue({ resolved: false });
    } else {
      updateIssue({ resolved: true, archived: false });
    }
  };

  const handleReject = () => {
    if (issue.archived) {
      updateIssue({ archived: false });
    } else {
      updateIssue({ archived: true, resolved: false });
    }
  };

  const renderActions = () => {
    if (issue.resolved) {
      return (
        <>
          <Flex alignItems="center" color="green.400" gap="2">
            <Icon as={CheckCircleIcon} />
            <Text fontSize="sm">This issue had been resolved</Text>
          </Flex>
          <Button onClick={handleResolve} variant="light">
            Unresolve
          </Button>
        </>
      );
    }

    if (issue.archived) {
      return (
        <>
          <Flex alignItems="center" color="green.400" gap="2">
            <Icon as={CheckCircleIcon} />
            <Text fontSize="sm">This issue had been archived</Text>
          </Flex>
          <Button onClick={handleReject} variant="light">
            Unarchive
          </Button>
        </>
      );
    }

    return (
      <>
        <Button
          px="3"
          onClick={handleResolve}
          leftIcon={<Icon as={CheckCircleIcon} />}
        >
          Resolve
        </Button>
        <Button
          px="3"
          onClick={handleReject}
          leftIcon={<Icon as={ArchiveIcon} />}
          variant="light"
        >
          Archive
        </Button>
      </>
    );
  };

  return <HStack spacing={2}>{renderActions()}</HStack>;
};

export default IssueResolver;
