import { useMemo, useTransition } from "react";
import { Flex, Tabs, TabPanels, TabPanel } from "@chakra-ui/react";
import { useDebugSession } from "../DebugSessionContext";
import { useDebugSessionLayout } from "../DebugSessionLayoutContext";

import OtelEvents from "./OtelEvents";
import ConsoleLogs from "./ConsoleLogs";

import OtelLogs from "./OtelLogs";
import OtelTraces from "./OtelTraces";
import AllSessionNodes from "./AllSessionNodes";
import { DebugSessionNodeType } from "../types";
import PageLoading from "shared/components/PageLoading";
import DebugSessionControlPanel from "pages/Workspace/Project/Debugger/DebugSession/DebugSessionDetails/DebugSessionControlPanel";
import DebugSessionTabs from "../DebugSessionTabs";
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
  RoleType,
} from "@multiplayer/types";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useThreads } from "shared/providers/ThreadsContext";
import SessionMetadata from "../SessionMetadata";
import SessionComments from "../SessionComments";
interface DebugSessionDetailsProps {
  readonly?: boolean;
}

const DebugSessionDetails = ({ readonly }: DebugSessionDetailsProps) => {
  const {
    session,
    tabIndex,
    setTabIndex,
    logsLoading,
    sessionNodes,
    eventsLoading,
    tracesLoading,
  } = useDebugSession();
  const { hasAccess } = usePermissions();
  const { createThread, threads, params } = useThreads();
  const [isPending, startTransition] = useTransition();
  const { detailsContainer, detailsWrapper } = useDebugSessionLayout();

  const onTabChange = (index) => {
    startTransition(() => {
      setTabIndex(index);
    });
  };

  const access = useMemo(
    () => ({
      readComment: hasAccess(
        RoleProjectPermissionEntity.THREAD,
        RoleAccessAction.READ,
        RoleType.PROJECT
      ),
      updateDebugSession: hasAccess(
        RoleProjectPermissionEntity.DEBUG_SESSION,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
    }),
    [hasAccess]
  );

  const tabs = useMemo(() => {
    const allCount = Object.values(DebugSessionNodeType).reduce(
      (acc, key) => acc + sessionNodes[key].length,
      0
    );

    return [
      { name: "All", count: allCount, visible: true },
      {
        name: "Events",
        visible: true,
        count: sessionNodes[DebugSessionNodeType.Event].length,
      },
      {
        name: "Console",
        visible: true,
        count: sessionNodes[DebugSessionNodeType.Console].length,
      },
      {
        name: "Traces",
        visible: true,
        count: sessionNodes[DebugSessionNodeType.Trace].length,
      },
      {
        name: "Logs",
        visible: true,
        count: sessionNodes[DebugSessionNodeType.Log].length,
      },
      { name: "Metadata", visible: true },
      ...(access.readComment
        ? [{ name: "Comments", count: threads.totalComments, visible: true }]
        : []),
    ];
  }, [sessionNodes, threads.totalComments]);

  const isReadonly = useMemo(
    () =>
      readonly ||
      !hasAccess(
        RoleProjectPermissionEntity.DEBUG_SESSION,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
    [hasAccess]
  );
  if (!session) return;

  return (
    <Flex
      ref={detailsWrapper}
      flex="1"
      minH="0"
      minW="0"
      w="full"
      direction="column"
      border="solid 1px"
      borderColor="border.primary"
      borderRadius="lg"
    >
      <Tabs
        isLazy
        flex="1"
        minH="0"
        as={Flex}
        display="flex"
        index={tabIndex}
        onChange={onTabChange}
        flexDirection="column"
      >
        <Flex
          pt="3"
          pb="0"
          gap="4"
          alignItems="center"
          justifyContent="space-between"
          borderBottom="1px solid"
          borderColor="border.primary"
        >
          <DebugSessionTabs
            tabs={tabs}
            tabIndex={tabIndex}
            onTabChange={onTabChange}
          />
        </Flex>

        <DebugSessionControlPanel readonly={isReadonly} />
        <Flex flex="1" minH="0" ref={detailsContainer} position="relative">
          <TabPanels minW="0" flex="1">
            <TabPanel h="full" p="0">
              {eventsLoading || tracesLoading || logsLoading ? (
                <PageLoading />
              ) : (
                <AllSessionNodes readonly={isReadonly} />
              )}
            </TabPanel>
            <TabPanel h="full" p="0">
              {tracesLoading ? (
                <PageLoading />
              ) : (
                <OtelEvents readonly={isReadonly} />
              )}
            </TabPanel>
            <TabPanel h="full" p="0">
              {eventsLoading ? (
                <PageLoading />
              ) : (
                <ConsoleLogs readonly={isReadonly} />
              )}
            </TabPanel>
            <TabPanel h="full" p="0">
              {tracesLoading ? (
                <PageLoading />
              ) : (
                <OtelTraces readonly={isReadonly} />
              )}
            </TabPanel>
            <TabPanel h="full" p="0">
              {logsLoading ? (
                <PageLoading />
              ) : (
                <OtelLogs readonly={isReadonly} />
              )}
            </TabPanel>
            <TabPanel h="full" p="0">
              <SessionMetadata readonly={isReadonly} />
            </TabPanel>
            {access.readComment && (
              <TabPanel h="full" p="0">
                <SessionComments />
              </TabPanel>
            )}
          </TabPanels>
        </Flex>
      </Tabs>
    </Flex>
  );
};

export default DebugSessionDetails;
