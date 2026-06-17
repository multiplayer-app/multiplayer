import { useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import IssueList from "pages/Workspace/Project/Issues/IssueList";
import { IssuePageBody } from "pages/Workspace/Project/Issues/IssuePreview";
import IssueToolbar from "pages/Workspace/Project/Issues/IssuePreview/IssueToolbar";
import { IssueProvider } from "shared/providers/IssueContext";
import { IssuesProvider } from "shared/providers/IssuesContext";

const IssuesPage = ({ issueId }: { issueId: string }) => {
  const content = useMemo(() => {
    if (issueId) {
      return (
        <IssueProvider identity={issueId} identityKey="_id">
          <Flex direction="column" flex="1" minH="0" minW="0">
            <IssueToolbar />
            <IssuePageBody />
          </Flex>
        </IssueProvider>
      );
    }
    return <IssueList />;
  }, [issueId]);

  return <IssuesProvider>{content}</IssuesProvider>;
};

export default IssuesPage;
