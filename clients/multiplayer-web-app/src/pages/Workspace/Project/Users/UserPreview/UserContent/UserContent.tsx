import {
  Box,
  Flex,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import UserHeader from "../UserHeader";
import { useUser } from "shared/providers/UserContext";
import UserSessions from "../UserSessions";
import UserIssues from "../UserIssues";
import UserDetails from "../UserDetails";
import UserMetrics from "pages/Workspace/Project/Users/UserPreview/UserMetrics";
import { useRef, useState } from "react";
import PageLoading from "shared/components/PageLoading";
import EmptyScreen from "shared/components/EmptyScreen";
import { MetricName } from "@multiplayer/types";
import EventDetailsDrawer from "shared/components/EventDetailsDrawer";

enum UserTabs {
  Sessions,
  Issues,
}

const UserContent = () => {
  const {
    user,
    loading,
    issueFilters,
    metricsPeriod,
    selectedEvent,
    setSelectedEvent,
    setIssueFilters,
    setMetricsPeriod,
  } = useUser();
  const [selectedTab, setSelectedTab] = useState(UserTabs.Sessions);
  const containerRef = useRef<HTMLDivElement>(null);
  if (!user && !loading) {
    return (
      <EmptyScreen
        title="User not found"
        description="The user you are looking for does not exist."
      />
    );
  }

  return (
    <Flex
      flex="1"
      minH="0"
      overflow="auto"
      direction="column"
      ref={containerRef}
    >
      <Flex
        flex="1"
        pt="6"
        px="4"
        w="full"
        mx="auto"
        maxW="1300px"
        direction="column"
      >
        {loading ? (
          <PageLoading />
        ) : (
          <>
            <UserHeader data={user?.data} />
            {user?.data && (
              <Box mt={3} w="full">
                <UserMetrics
                  series={[
                    {
                      color: "blue",
                      metricName: "Sessions",
                      series:
                        user?.data?.metrics?.[
                          MetricName.SESSION_RECORDING_RATE
                        ] || [],
                    },
                    {
                      metricName: "Issues",
                      series:
                        user?.data?.metrics?.[MetricName.ISSUE_RATE] || [],
                    },
                  ]}
                  period={metricsPeriod}
                  setPeriod={setMetricsPeriod}
                />
              </Box>
            )}
            <HStack gap="8" py="8" align="flex-start">
              <Tabs
                isLazy
                flex="1"
                minW="0"
                display="flex"
                flexDirection="column"
                index={selectedTab}
                onChange={setSelectedTab}
              >
                <TabList>
                  <Tab>Sessions</Tab>
                  <Tab>Issues</Tab>
                  <Tab>Metadata</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px="0">
                    <UserSessions />
                  </TabPanel>
                  <TabPanel px="0">
                    <UserIssues
                      issues={user.issues}
                      loading={loading}
                      filters={issueFilters}
                      setFilters={setIssueFilters}
                    />
                  </TabPanel>
                  <TabPanel px="0">
                    <UserDetails />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </HStack>
          </>
        )}
      </Flex>
      <EventDetailsDrawer
        event={selectedEvent}
        containerRef={containerRef}
        setEvent={setSelectedEvent}
      />
    </Flex>
  );
};

export default UserContent;
