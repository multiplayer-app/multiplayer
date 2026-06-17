import { Flex, Icon, Text } from "@chakra-ui/react";
import {
  IIssue,
  IDebugSession,
  DebugSessionNodeType,
} from "@multiplayer/types";
import { ExternalLinkIcon } from "shared/icons";
import IconButton from "shared/components/IconButton";
import Drawer, { DrawerContent } from "shared/components/Drawer";
import TraceNodeDetails from "shared/components/TraceNodeDetails";
import { NavigationMode, useTabs } from "shared/providers/TabsContext";

import { IssueDetailsContent } from "pages/Workspace/Project/Issues/IssuePreview/IssueDetails";
import { DebugSessionPreviewDrawer } from "pages/Workspace/Project/Debugger";

interface EventDetailsDrawerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  event: { type: "issue" | "span" | "session" | "user"; data: any };
  setEvent: (event: any) => void;
}

const EventDetailsDrawer = ({
  containerRef,
  event,
  setEvent,
}: EventDetailsDrawerProps) => {
  const { onSessionOpen } = useTabs();

  if (!event) return null;

  if (event.type === "session") {
    const session = event.data as IDebugSession;
    const handleOpenInNewTab = (e: React.MouseEvent<any>) => {
      const mode =
        e.metaKey || e.ctrlKey ? NavigationMode.NEW_TAB : NavigationMode.TABS;
      onSessionOpen(session, mode);
    };

    const handleClose = () => {
      setEvent(null);
    };

    return (
      <DebugSessionPreviewDrawer
        sessionId={session._id}
        containerRef={containerRef}
        onClose={handleClose}
        onOpenInNewTab={handleOpenInNewTab}
      />
    );
  }

  return (
    <Drawer isOpen={!!event}>
      <DrawerContent
        parentContainer={containerRef.current}
        onClose={() => setEvent(null)}
      >
        {event && <EventDetails type={event.type} data={event.data} />}
      </DrawerContent>
    </Drawer>
  );
};

const EventDetails = ({ type, data }: { type: string; data: any }) => {
  const { onIssueOpen } = useTabs();
  const handleOpenInNewTab = (e) => {
    const mode =
      e.metaKey || e.ctrlKey ? NavigationMode.NEW_TAB : NavigationMode.TABS;
    if (type === "issue") {
      onIssueOpen(data, mode);
    }
  };

  switch (type) {
    case "issue":
      return (
        <Flex direction="column" flex="1" minH="0">
          <Flex
            px="4"
            py="2"
            gap="4"
            minH="14"
            alignItems="center"
            justifyContent="space-between"
            position="sticky"
            top="0"
          >
            <Text flex="1" fontSize="lg" fontWeight="medium">
              Issue information
            </Text>
            <IconButton
              size="sm"
              top="4"
              right="12"
              variant="base"
              color="muted"
              label="Open in new tab"
              position="absolute"
              icon={<Icon as={ExternalLinkIcon} />}
              onClick={handleOpenInNewTab}
            />
          </Flex>
          <Flex
            flex="1"
            minH="0"
            p="4"
            gap="4"
            overflow="auto"
            direction="column"
            className="custom-scroll"
          >
            <IssueDetailsContent issue={data as IIssue} />
          </Flex>
        </Flex>
      );
    case "span":
      return (
        <Flex direction="column" flex="1" minH="0">
          <Flex
            px="4"
            py="2"
            gap="4"
            minH="14"
            alignItems="center"
            justifyContent="space-between"
            position="sticky"
            top="0"
          >
            <Text flex="1" fontSize="lg" fontWeight="medium">
              Span information
            </Text>
          </Flex>
          <Flex
            p="4"
            flex="1"
            minH="0"
            overflow="auto"
            direction="column"
            className="custom-scroll"
          >
            <TraceNodeDetails type={DebugSessionNodeType.Trace} meta={data} />
          </Flex>
        </Flex>
      );
  }
};
export default EventDetailsDrawer;
