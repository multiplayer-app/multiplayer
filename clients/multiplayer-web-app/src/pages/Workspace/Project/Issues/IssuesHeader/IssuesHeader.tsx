import { Flex, Button, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useProjectSettingsPath } from "shared/hooks/useProjectSettingsPath";

interface IssuesHeaderProps {}

const IssuesHeader = (props: IssuesHeaderProps) => {
  const { segmentPath } = useProjectSettingsPath();
  const issuesSettingsPath = segmentPath("issues");

  return (
    <Flex
      gap="2"
      py="4"
      justifyContent="space-between"
      px={{ base: "4", lg: "10" }}
      alignItems={{ base: "flex-start", lg: "center" }}
    >
      <Text fontSize="24px" fontWeight="600">
        Issue Groups
      </Text>
      {issuesSettingsPath ? (
        <Button as={Link} to={issuesSettingsPath} variant="light">
          Issues Settings
        </Button>
      ) : null}
    </Flex>
  );
};

export default IssuesHeader;
