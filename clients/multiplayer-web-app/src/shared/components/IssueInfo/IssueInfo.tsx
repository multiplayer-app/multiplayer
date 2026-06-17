import { Flex, Box, FlexProps } from "@chakra-ui/react";
import { IIssue } from "@multiplayer/types";

import IssueTitle from "./IssueTitle";
import IssueHostInfo from "./IssueHostInfo";
import IssueServiceInfo from "./IssueServiceInfo";

const IssueInfo = ({ issue, ...rest }: { issue: IIssue } & FlexProps) => {
  const { title, metadata, service } = issue;
  return (
    <Flex direction="column" minW="0" gap="1" py="2" {...rest}>
      <Box position="relative" h="5" w="full">
        <IssueTitle
          inset="0"
          position="absolute"
          title={title}
          metadata={metadata}
        />
      </Box>
      <IssueHostInfo metadata={metadata} />
      <IssueServiceInfo service={service} />
    </Flex>
  );
};

export default IssueInfo;
