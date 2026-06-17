import { Flex, Text } from "@chakra-ui/react";
import UserIssueFilters from "./UserIssueFilters";
import { TableSimple as Table } from "shared/components/Table";
import { useCallback, useMemo, useState } from "react";
import {
  ComponentType,
  IIssue,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import { NavigationMode, useTabs } from "shared/providers/TabsContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import TimeAgo from "shared/components/TimeAgo";
import { SeverityBadge } from "pages/Workspace/Project/Issues/Severity";
import NodeIcon from "shared/components/NodeIcon";

const UserIssues = ({ issues, loading, filters, setFilters }) => {
  const { onIssueOpen } = useTabs();
  const { hasAccess } = usePermissions();
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isAllSelected, setIsAllSelected] = useState(false);

  const access = useMemo(() => {
    return {
      deleteSession: hasAccess(
        RoleProjectPermissionEntity.ISSUE,
        RoleAccessAction.DELETE,
        RoleType.PROJECT
      ),
    };
  }, [hasAccess]);

  const handleRowClick = (
    row: IIssue,
    e: React.MouseEvent<HTMLTableRowElement>
  ) => {
    const mode =
      e.metaKey || e.ctrlKey ? NavigationMode.NEW_TAB : NavigationMode.TABS;
    onIssueOpen(row, mode);
  };

  const onSortingChange = useCallback((sorting) => {
    setFilters((prev) => ({
      ...prev,
      sorting,
      skip: 0,
    }));
  }, []);

  const onScrollEnd = useCallback(() => {
    if (loading) return;
    const { skip, limit } = filters.params;
    if (skip + limit < issues.cursor.total) {
      setFilters(({ params, ...rest }) => ({
        ...rest,
        params: { ...params, skip: params.skip + limit },
      }));
    }
  }, [loading, filters.params, issues.cursor.total]);

  const isFilterEmpty = useMemo(
    () => !filters, // Todo update the logic after filters are done
    [filters]
  );

  const onAllRowsSelect = useCallback(
    (isSelected: boolean) => {
      if (isFilterEmpty) {
        setIsAllSelected(isSelected);
      }

      const selection = isSelected
        ? Object.fromEntries(issues.data.map((_, index) => [index, true]))
        : {};

      setSelectedRows(selection);
    },
    [issues.data, isFilterEmpty]
  );

  const columns = useMemo(
    () => [
      {
        field: "title",
        name: "Issue",
        sortable: true,
        width: "30%",
        component: ({ title, metadata }) => {
          const message = title || metadata?.message;
          return (
            <Flex direction="column" minW="0" gap="2" py="2">
              <Text noOfLines={1} fontWeight="500" title={message}>
                {message}
              </Text>
            </Flex>
          );
        },
      },
      {
        field: "lastSeen",
        name: "Last seen",
        sortable: true,
        width: "20%",
        component: ({ lastSeen }) =>
          lastSeen ? <TimeAgo date={lastSeen} /> : "",
      },
      {
        field: "severity",
        name: "Severity",
        width: "20%",
        sortable: true,
        component: ({ severity }) => {
          return <SeverityBadge value={severity} />;
        },
      },
      {
        field: "component",
        name: "Component",
        width: "30%",
        component: ({ service }) => (
          <Flex alignItems="center" gap={2}>
            <Text noOfLines={1} title={service?.serviceName}>
              <NodeIcon type={ComponentType.GENERIC} mr="8px" />
              {service?.serviceName || "-"}
            </Text>
          </Flex>
        ),
      },
    ],
    []
  );

  return (
    <Flex flexDirection="column" gap={2}>
      <UserIssueFilters filters={filters} setFilters={setFilters} />
      <Table
        data={issues.data}
        columns={columns}
        loading={loading}
        tableName="userIssues"
        useInfiniteScrolling={true}
        pageParams={{ skip: filters.skip || 0, limit: filters.limit || 10 }}
        totalItemsCount={issues?.cursor?.total}
        noDataText={"No user issues found"}
        useRowSelection={access.deleteSession}
        selectedRows={selectedRows}
        sorting={filters.sorting}
        onSortingChange={onSortingChange}
        onScrollEnd={onScrollEnd}
        onRowClick={handleRowClick}
        onAllRowsSelect={onAllRowsSelect}
        setSelectedRows={setSelectedRows}
      />
    </Flex>
  );
};

export default UserIssues;
