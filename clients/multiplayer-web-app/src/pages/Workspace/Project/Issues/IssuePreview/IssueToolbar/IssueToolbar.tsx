import { ChevronLeftIcon } from "@chakra-ui/icons";
import { Button, Icon } from "@chakra-ui/react";

import Toolbar from "shared/components/Toolbar";
import AddToChat from "shared/components/AddToChat";
import { useIssue } from "shared/providers/IssueContext";
import { IS_VSCODE, useVsCode } from "vscode/VsCodeContext";

const IssueToolbar = () => {
  const { issue } = useIssue();
  const { setState, fixIssue } = useVsCode();

  if (!IS_VSCODE || !issue) {
    return null;
  }

  const handleBackToIssues = () => {
    setState((prev) => ({
      ...prev,
      issueId: "",
      currentPage: "issue",
    }));
  };

  const handleAddToChat = (assistantId?: string) => {
    fixIssue(issue._id, { issue }, assistantId);
  };

  return (
    <Toolbar
      width="100%"
      leftContent={
        <Button
          size="sm"
          variant="light"
          borderRadius="20px"
          onClick={handleBackToIssues}
          leftIcon={<Icon as={ChevronLeftIcon} />}
        >
          Issues
        </Button>
      }
      rightContent={<AddToChat onAddToChat={handleAddToChat} />}
    />
  );
};

export default IssueToolbar;
