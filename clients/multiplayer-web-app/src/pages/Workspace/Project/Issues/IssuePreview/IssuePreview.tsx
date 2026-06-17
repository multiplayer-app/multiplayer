import {
  Box,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FeatureFlag, IIssue, IssueGroupBy } from "@multiplayer/types";

import EmptyScreen from "shared/components/EmptyScreen";
import EventDetailsDrawer from "shared/components/EventDetailsDrawer";
import PageLoading from "shared/components/PageLoading";
import useMessage from "shared/hooks/useMessage";
import { IssueProvider, useIssue } from "shared/providers/IssueContext";
import { getIssues } from "shared/services/radar.service";

import IssueComponentList from "./IssueComponentList";
import IssueDetails from "./IssueDetails";
import IssueEndUsers from "./IssueEndUsers";
import IssueHeader from "./IssueHeader";
import IssueMetrics from "./IssueMetrics";
import IssueSessions from "./IssueSessions";
import { WidthFeatureCheck } from "shared/components/CheckFeature";

interface IssuePreviewProps {}

const COMPONENT_HASH_PARAM = "componentHash";

/** Scrollable issue view (header, metrics, tabs, event drawer). Requires `IssueProvider` above. */
export function IssuePageBody() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { issue, loading, selectedEvent, setSelectedEvent } = useIssue();

  return (
    <Flex
      flex="1"
      minH="0"
      minW="0"
      overflow="auto"
      direction="column"
      ref={containerRef}
      w="full"
    >
      {issue ? (
        <IssuePageContent />
      ) : loading ? (
        <PageLoading />
      ) : (
        <EmptyScreen
          title="Issue not found"
          description="The issue you are looking for does not exist."
        />
      )}
      <EventDetailsDrawer
        event={selectedEvent}
        containerRef={containerRef}
        setEvent={setSelectedEvent}
      />
    </Flex>
  );
}

/** Main issue layout: header, metrics, sub-tabs (sessions, users, metadata). */
export function IssuePageContent() {
  return (
    <Box maxW="1300px" w="full" pt="6" px="4" pb="8" mx="auto">
      <IssueHeader />
      <Box py="6">
        <Box mb="6">
          <IssueMetrics />
        </Box>
        <Tabs isLazy>
          <TabList
            overflowX="auto"
            whiteSpace="nowrap"
            className="hidden-scrollbar"
          >
            <Tab>Sessions</Tab>
            <Tab>Metadata</Tab>
            <WidthFeatureCheck as={Tab} feature={FeatureFlag.END_USERS}>
              Users affected
            </WidthFeatureCheck>
          </TabList>
          <TabPanels>
            <TabPanel px="0">
              <IssueSessions />
            </TabPanel>
            <TabPanel px="0">
              <IssueDetails />
            </TabPanel>
            <WidthFeatureCheck
              px="0"
              as={TabPanel}
              feature={FeatureFlag.END_USERS}
            >
              <IssueEndUsers />
            </WidthFeatureCheck>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
}

const IssuePreview = (_props: IssuePreviewProps) => {
  const { workspaceId, projectId, path: titleHash } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const componentHash = searchParams.get(COMPONENT_HASH_PARAM);
  const message = useMessage();

  const [issues, setIssues] = useState<IIssue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId || !projectId || !titleHash) {
      setIssues([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    getIssues(workspaceId, projectId, {
      titleHash: titleHash,
      groupBy: IssueGroupBy.COMPONENT_HASH,
      limit: 100,
    })
      .then((res) => {
        if (cancelled) return;
        setIssues(res.data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        message.handleError(err);
        setIssues([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId, titleHash, message]);

  const selectedIssue = useMemo(() => {
    if (!issues.length) return null;
    if (componentHash) {
      return issues.find((i) => i.componentHash === componentHash) ?? issues[0];
    }
    return issues[0];
  }, [issues, componentHash]);

  useEffect(() => {
    if (!selectedIssue?.componentHash) return;
    if (componentHash === selectedIssue.componentHash) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(COMPONENT_HASH_PARAM, selectedIssue.componentHash);
        return next;
      },
      { replace: true }
    );
  }, [selectedIssue?.componentHash, componentHash, setSearchParams]);

  const isDesktop =
    useBreakpointValue({ base: false, md: true }, { ssr: false }) === true;

  const handleSelectComponent = useCallback(
    (hash: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(COMPONENT_HASH_PARAM, hash);
        return next;
      });
    },
    [setSearchParams]
  );

  const identity = selectedIssue?._id ?? selectedIssue?.componentHash;
  const identityKey = selectedIssue?._id ? "_id" : "componentHash";
  return (
    <Flex flex="1" minH="0" minW="0" direction="row">
      {isDesktop ? (
        <IssueComponentList
          issues={issues}
          loading={loading}
          selectedComponentHash={selectedIssue?.componentHash ?? componentHash}
          onSelect={handleSelectComponent}
        />
      ) : null}
      <Flex flex="1" minH="0" minW="0" direction="column">
        {selectedIssue ? (
          <IssueProvider
            key={identity}
            identity={identity}
            identityKey={identityKey}
            initialIssue={selectedIssue}
          >
            <IssuePageBody />
          </IssueProvider>
        ) : loading ? (
          <PageLoading />
        ) : (
          <EmptyScreen
            title="Issue not found"
            description="No components reported for this issue group."
          />
        )}
      </Flex>
    </Flex>
  );
};

export default IssuePreview;
