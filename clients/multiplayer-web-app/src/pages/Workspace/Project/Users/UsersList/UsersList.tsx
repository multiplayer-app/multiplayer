import {
  Box,
  Flex,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import SelectionIndicator from "shared/components/SelectionIndicator";
import {
  ChevronDownIcon,
  RecordingIcon,
  TrashIcon,
  UserEntityIcon,
} from "shared/icons";
import { TableSimple as Table } from "shared/components/Table";
import UsersHeader from "../UsersHeader";
import UsersFilters from "../UsersFilters";
import { useCallback, useMemo, useRef } from "react";
import useTableSelection from "shared/hooks/useTableSelection";
import { useUsers } from "shared/providers/UsersContext";
import {
  EndUserState,
  EndUserType,
  IEndUser,
  MetricName,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { NavigationMode, useTabs } from "shared/providers/TabsContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import TimeAgo from "shared/components/TimeAgo";
import IssueRateChart from "shared/components/IssueRateChart";
import { MetricsGranularityMap } from "shared/hooks/useIssuesFilters";
import { IssueRateChartPeriod } from "shared/models/enums";
import UserRecordingPopup from "shared/components/UserRecordingPopup";
import ColumnConfigDropdown from "shared/components/ColumnConfigDropdown";
import useLocalStorage from "shared/hooks/useLocalStorage";
import EndUserStatusBadge from "shared/components/EndUserStatusBadge";
import { useNavigate, useParams } from "react-router-dom";
const defaultColumnConfig = {
  name: true,
  status: true,
  email: true,
  organization: true,
  environment: false,
  activity: true,
  issues: true,
  lastSeen: true,
  createdAt: false,
};

const isRecording = (connections: IEndUser["connections"]) =>
  connections.some((conn) => conn.state === EndUserState.RECORDING);

const UsersList = () => {
  const navigate = useNavigate();
  const { onUserOpen } = useTabs();
  const { hasAccess } = usePermissions();
  const { openAlertDialog } = useAlertDialog();
  const { workspaceId, projectId } = useParams();
  const scrollContainer = useRef<HTMLDivElement>();
  const { withSandboxCheck } = useProjectSandbox();
  const { isOpen, onOpen: onOpenRecordingSettings, onClose } = useDisclosure();
  const { users, loading, filters, setFilters, deleteUsers } = useUsers();

  const {
    selectedRows,
    selectedIds,
    selectedItemsCount,
    resetSelection,
    onAllRowsSelect,
    setSelectedRows,
  } = useTableSelection({
    data: users.data,
    getId: (user) => user?._id,
  });

  const access = useMemo(() => {
    return {
      deleteSession: hasAccess(
        RoleProjectPermissionEntity.END_USER,
        RoleAccessAction.DELETE,
        RoleType.PROJECT
      ),
    };
  }, [hasAccess]);

  const onPeriodChange = useCallback((period: IssueRateChartPeriod) => {
    setFilters((prev) => ({
      ...prev,
      skip: 0,
      period,
    }));
  }, []);

  // Column visibility state
  const [columnConfig, setColumnConfig] = useLocalStorage(
    "usersColumnVisibility",
    defaultColumnConfig
  );

  const onColumnConfigChange = useCallback((field: string, value: boolean) => {
    setColumnConfig((prev) => ({ ...prev, [field]: value }));
  }, []);

  const navigateToSession = (connections: IEndUser["connections"]) => {
    const sessionId = connections.length && connections[0].sessionRecording;
    navigate(
      `/project/${workspaceId}/${projectId}/default/debugger/session/${sessionId}`
    );
  };

  const columnConfigs = useMemo(
    () => [
      {
        field: "name",
        sortable: true,
        name: "Name",
        maxWidth: "240px",
        component: ({ attributes, online, connections }) => (
          <Flex
            gap="2"
            alignItems="center"
            whiteSpace="nowrap"
            title={attributes.name}
          >
            <Box position="relative">
              <Icon as={UserEntityIcon} boxSize={6} />
              {isRecording(connections) ? (
                <Box
                  position="absolute"
                  width={4}
                  height={4}
                  right="-6px"
                  top="-8px"
                >
                  <Icon as={RecordingIcon} boxSize={4} />
                </Box>
              ) : (
                online && (
                  <Box
                    position="absolute"
                    width="9px"
                    height="9px"
                    border="1px solid white"
                    right="-2px"
                    top="-2px"
                    borderRadius="50%"
                    backgroundColor="green.400"
                  />
                )
              )}
            </Box>
            {attributes.name}
          </Flex>
        ),
      },
      {
        field: "status",
        sortable: false,
        name: "Status",
        component: ({ conditionalRecordingSettings, connections, online }) => {
          return (
            <EndUserStatusBadge
              connections={connections}
              online={online}
              conditionalRecordingSettings={conditionalRecordingSettings}
              onRecordingClick={() => navigateToSession(connections)}
            />
          );
        },
      },
      {
        field: "email",
        sortable: false,
        name: "Email",
        component: ({ attributes }) => (
          <Text title={attributes.userEmail}>{attributes.userEmail}</Text>
        ),
      },
      {
        field: "organization",
        sortable: true,
        name: "Organization",
        component: ({ attributes }) => <>{attributes.orgName}</>,
      },
      {
        field: "environment",
        sortable: true,
        name: "Environment",

        component: ({ attributes }) => (
          <>{attributes.environment || attributes.environmentSlug}</>
        ),
      },
      {
        field: "issues",
        sortable: false,
        name: "Issues",
        width: "160px",
        minWidth: 160,
        headerComponent: () => (
          <Flex
            flex="1"
            gap="2"
            alignItems="center"
            whiteSpace="nowrap"
            justifyContent="space-between"
          >
            <Box>Issues</Box>
            <Menu>
              <MenuButton fontWeight="medium">
                {filters.period} <Icon as={ChevronDownIcon} boxSize="4" />
              </MenuButton>
              <MenuList minW="80px">
                {Object.keys(MetricsGranularityMap).map((period) => (
                  <MenuItem
                    key={period}
                    onClick={() =>
                      onPeriodChange(period as IssueRateChartPeriod)
                    }
                  >
                    {period}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </Flex>
        ),
        component: ({ metrics }) =>
          metrics?.[MetricName.ISSUE_RATE] &&
          metrics[MetricName.ISSUE_RATE].length > 0 ? (
            <IssueRateChart
              period={filters.period}
              data={[
                {
                  metricName: "Issues",
                  series: metrics[MetricName.ISSUE_RATE],
                },
              ]}
              width="full"
              height={5}
            />
          ) : null,
      },
      {
        field: "lastSeen",
        name: "Last seen",
        sortable: true,
        component: ({ lastSeen }) =>
          lastSeen ? <TimeAgo date={lastSeen} /> : "",
      },
      {
        field: "createdAt",
        name: "Created at",
        sortable: true,
        component: ({ createdAt }) => <TimeAgo date={createdAt} />,
      },
    ],
    [filters.period, onPeriodChange]
  );

  // Filter columns based on visibility
  const columns = useMemo(() => {
    return columnConfigs.reduce((acc, column) => {
      if (columnConfig[column.field] !== false) {
        acc.push(column);
      }
      return acc;
    }, []);
  }, [columnConfigs, columnConfig]);

  const scrollToTop = useCallback(() => {
    const container = scrollContainer.current;
    if (!container) return;

    container.scrollTo({ top: 0 });
  }, []);

  const handlePageChange = useCallback(
    (skip: number) => {
      scrollToTop();
      setFilters((prev) => ({ ...prev, skip }));
    },
    [scrollToTop, setFilters]
  );

  const handlePageSizeChange = useCallback(
    (limit: number) => {
      scrollToTop();
      setFilters((prev) => ({ ...prev, limit, skip: 0 }));
    },
    [scrollToTop, setFilters]
  );

  const onSelectionDelete = async () => {
    const result = await openAlertDialog({
      title: "Deleting end users",
      description: "Are you sure you want to delete the selected users?",
    });

    if (result) {
      deleteUsers(selectedIds);
      resetSelection();
    }
  };

  const handleRowClick = (
    row: IEndUser,
    e: React.MouseEvent<HTMLTableRowElement>
  ) => {
    const mode =
      e.metaKey || e.ctrlKey ? NavigationMode.NEW_TAB : NavigationMode.TABS;
    onUserOpen(row, mode);
  };

  const onSortingChange = useCallback((sorting) => {
    setFilters((prev) => ({
      ...prev,
      sorting,
      skip: 0,
    }));
  }, []);

  return (
    <Flex
      pb="4"
      flex="1"
      minH="full"
      overflow="auto"
      direction="column"
      ref={scrollContainer}
    >
      <UsersHeader />
      <VStack px={{ base: "4", lg: "10" }}>
        {selectedItemsCount > 0 ? (
          <Flex
            py="2"
            top="0"
            w="full"
            zIndex="10"
            bg="bg.primary"
            position="sticky"
          >
            <SelectionIndicator
              alignSelf="self-start"
              count={
                selectedItemsCount === users.data.length
                  ? "All"
                  : selectedItemsCount
              }
              onResetSelection={resetSelection}
              actionButtons={
                <Flex alignItems="center">
                  {filters.type !== EndUserType.VISITOR && (
                    <Tooltip label="Open recording settings" openDelay={800}>
                      <Flex
                        pl={2}
                        alignItems="center"
                        cursor="pointer"
                        borderRight="1px"
                        borderRightColor="border.secondary"
                        _hover={{ backgroundColor: "bg.subtle" }}
                        onClick={withSandboxCheck(onOpenRecordingSettings)}
                      >
                        <Text color="muted" fontWeight={600} fontSize="sm">
                          Record
                        </Text>{" "}
                        <IconButton
                          size="md"
                          variant="ghost"
                          aria-label="delete"
                          borderRadius="0"
                        />
                      </Flex>
                    </Tooltip>
                  )}
                  <Tooltip label="Delete selected items" openDelay={800}>
                    <IconButton
                      size="md"
                      variant="ghost"
                      aria-label="delete"
                      borderLeftRadius="0"
                      onClick={withSandboxCheck(onSelectionDelete)}
                    >
                      <Icon color="muted" as={TrashIcon} />
                    </IconButton>
                  </Tooltip>
                </Flex>
              }
            />
          </Flex>
        ) : (
          <UsersFilters
            filters={filters}
            setFilters={setFilters}
            tableData={users.data}
          >
            <ColumnConfigDropdown
              columns={columnConfigs.map((col) => ({
                field: col.field,
                name: col.name,
              }))}
              config={columnConfig}
              onChange={onColumnConfigChange}
            />
          </UsersFilters>
        )}

        <Table
          data={users.data}
          columns={columns}
          loading={loading}
          tableName="users"
          usePagination={true}
          pageParams={{
            skip: filters.skip || 0,
            limit: filters.limit || 10,
          }}
          sorting={filters.sorting}
          tableWrapperHeight="auto"
          tableWrapperOverflow="hidden"
          totalItemsCount={users.cursor.total}
          noDataText={
            filters.type === EndUserType.USER
              ? "No users found"
              : filters.type === EndUserType.API_CLIENT
              ? "No API clients found"
              : "No visitors found"
          }
          useRowSelection={access.deleteSession}
          selectedRows={selectedRows}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortingChange={onSortingChange}
          onRowClick={handleRowClick}
          onAllRowsSelect={onAllRowsSelect}
          setSelectedRows={setSelectedRows}
        />
      </VStack>
      <UserRecordingPopup
        isOpen={isOpen}
        onClose={onClose}
        type={filters.type}
        selectedIds={selectedIds}
      />
    </Flex>
  );
};

export default UsersList;
