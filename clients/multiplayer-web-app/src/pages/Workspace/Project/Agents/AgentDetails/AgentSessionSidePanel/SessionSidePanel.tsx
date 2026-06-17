import {
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { memo, useMemo } from "react";

import { getNestedProperty } from "shared/utils";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

import IssueTab from "./IssueTab";
import OverviewTab from "./OverviewTab";
import RecordingTab from "./RecordingTab";
import { IAgentChat } from "@multiplayer/types";

export type SessionSidePanelProps = {
  tabIndex: number;
  session: IAgentChat;
  onTabChange: (index: number) => void;
};

const SessionSidePanel = memo(function SessionSidePanel({
  session,
  tabIndex,
  onTabChange,
}: SessionSidePanelProps) {
  const { isSandbox } = useProjectSandbox();
  const { issueComponentHash, debugSessionId } = useMemo(() => {
    return {
      issueComponentHash: getNestedProperty(
        session.metadata,
        "issue.componentHash"
      ),
      debugSessionId: getNestedProperty(session.metadata, "debugSession._id"),
    };
  }, [session]);

  return (
    <Flex
      minH="0"
      flex="1"
      minW="0"
      direction="column"
      bg="bg.primary"
      overflow="hidden"
      role="complementary"
      aria-label="Session details"
      data-tour={isSandbox ? "mp-sandbox-recording-view" : undefined}
    >
      <Tabs
        isLazy
        flex="1"
        display="flex"
        flexDirection="column"
        minH="0"
        variant="line"
        colorScheme="brand"
        index={tabIndex}
        onChange={onTabChange}
      >
        <TabList
          flexShrink={0}
          px="3"
          pt="2"
          borderBottomWidth="1px"
          borderColor="border.primary"
          gap="1"
        >
          {debugSessionId && <Tab fontSize="sm">Recording</Tab>}
          {issueComponentHash && <Tab fontSize="sm">Issue</Tab>}
          <Tab fontSize="sm">Metadata</Tab>
        </TabList>
        <TabPanels flex="1" minH="0" overflow="hidden">
          {debugSessionId && (
            <TabPanel
              p="0"
              h="full"
              display="flex"
              overflow="hidden"
              flexDirection="column"
            >
              <RecordingTab debugSessionId={debugSessionId} />
            </TabPanel>
          )}

          {issueComponentHash && (
            <TabPanel
              p="0"
              h="full"
              display="flex"
              overflow="hidden"
              flexDirection="column"
            >
              <IssueTab componentHash={issueComponentHash} />
            </TabPanel>
          )}
          <TabPanel overflow="hidden" h="full" p="0">
            <OverviewTab session={session} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
});

export default SessionSidePanel;
