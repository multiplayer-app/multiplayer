import { useParams } from "react-router-dom";
import { Flex, Icon, Image, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

import { getDuration } from "shared/utils";
import { DebuggerIcon, GearIcon } from "shared/icons";

import TimeAgo from "shared/components/TimeAgo";
import PageLoading from "shared/components/PageLoading";
import EmptyScreen from "shared/components/EmptyScreen";
import ExplorerItem from "shared/components/ExplorerItem";
import DebounceSearch from "shared/components/DebounceSearch";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import EmptyEnvironments from "assets/images/emptyStates/environments-empty-list.png";

import { useTabs } from "shared/providers/TabsContext";
import { useDebugSessions } from "shared/providers/DebugSessionsContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import OtelKeysSettingsLink from "shared/components/OtelKeysSettingsLink";

interface DebugSessionsProps {}

const DebugSessions = (props: DebugSessionsProps) => {
  const { onSessionOpen } = useTabs();
  const { focusTab } = useTabs();
  const { path: sessionId } = useParams();
  const { withSandboxCheck } = useProjectSandbox();
  const { sessions, getSessions } = useDebugSessions();

  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ skip: 0, limit: 50, name: null });

  const getData = useCallback(async () => {
    try {
      setLoading(true);
      await getSessions(params);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [getSessions, params]);

  const handleScrollEnd = () => {
    if (loading || params.skip + params.limit > sessions.cursor.total) {
      return;
    }
    setParams((prevParams) => ({
      ...prevParams,
      skip: prevParams.skip + prevParams.limit,
    }));
  };

  const setQuery = (query: string) => {
    setParams((prevParams) => ({
      ...prevParams,
      skip: 0,
      name: query || null,
    }));
  };

  useEffect(() => {
    getData();
  }, [getData]);

  return (
    <>
      <DebounceSearch onSearch={setQuery} inputGroupProps={{ mb: 0 }} />
      {!sessions.data.length ? (
        loading ? (
          <PageLoading />
        ) : (
          <EmptyScreen
            title="You don't have a platform debugger session yet!"
            description="All platform debugger session recordings will appear here."
            icon={<Image mb="2" w="180px" src={EmptyEnvironments} />}
          >
            <OtelKeysSettingsLink
              variant="light"
              aria-label="settings"
              rightIcon={<GearIcon width="16px" />}
              onClick={withSandboxCheck(() => {})}
            >
              Configure Session Recorder
            </OtelKeysSettingsLink>
          </EmptyScreen>
        )
      ) : (
        <InfiniteScrollBox
          flex="1"
          pl="4"
          pr="3.5"
          mt="4"
          mx="-4"
          mb="-4"
          isLoading={loading}
          onScrollEnd={handleScrollEnd}
        >
          {sessions.data.map((s) => (
            <ExplorerItem
              p="2"
              h="auto"
              gap="2"
              key={s._id}
              isActive={s._id === sessionId}
              onClick={() => onSessionOpen(s)}
              onDoubleClick={focusTab}
            >
              <Icon as={DebuggerIcon} />
              <Flex direction="column" flex="1" minW="0">
                <Text noOfLines={1} title={s.name || s._id}>
                  {s.name || s._id}
                </Text>
                <Text color="muted" fontSize="smaller">
                  <TimeAgo date={s.startedAt} />
                  <Duration start={s.startedAt} end={s.stoppedAt} />
                </Text>
              </Flex>
            </ExplorerItem>
          ))}
        </InfiniteScrollBox>
      )}
    </>
  );
};

const Duration = ({ start, end }) => {
  if (!end) return null;
  return <> · {getDuration(start, end)}</>;
};

export default DebugSessions;
