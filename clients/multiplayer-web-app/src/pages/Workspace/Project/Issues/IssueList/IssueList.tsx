import {
  Flex,
  Icon,
  MenuButton,
  MenuList,
  Menu,
  MenuItem,
  Box,
} from "@chakra-ui/react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";

import {
  IIssue,
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  MetricName,
} from "@multiplayer/types";

import { ChevronDownIcon } from "shared/icons";
import TimeAgo from "shared/components/TimeAgo";
import { TableSimple } from "shared/components/Table";
import IssueRateChart from "shared/components/IssueRateChart";
import IssueInfo from "shared/components/IssueInfo";
import ColumnConfigDropdown from "shared/components/ColumnConfigDropdown";

import { IssueRateChartPeriod } from "shared/models/enums";

import { useIssues } from "shared/providers/IssuesContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import { NavigationMode, useTabs } from "shared/providers/TabsContext";
import useLocalStorage from "shared/hooks/useLocalStorage";
import useTableSelection from "shared/hooks/useTableSelection";
import { MetricsGranularityMap } from "shared/hooks/useIssuesFilters";
import { useVsCode } from "vscode/VsCodeContext";
import { SeverityToggle } from "../Severity";
import IssuesHeader from "../IssuesHeader";
import IssuesFilters from "../IssuesFilters";
import BulkOperations from "./BulkOperations";
import LazyRender from "shared/components/LazyRender";
import { ISSUE_HASH_KEY } from "shared/configs/issues.configs";

interface IssueListProps {}

const IssueList = memo((props: IssueListProps) => {
  const scrollContainer = useRef<HTMLDivElement>();
  const { onIssueOpen } = useTabs();
  const { sendMessage } = useVsCode();
  const { hasAccess } = usePermissions();

  const {
    issues,
    loading,
    filters,
    issuesStateRef,
    hasFilters,
    setFilters,
    updateIssueSeverity,
  } = useIssues();

  const {
    selectedIds,
    selectedRows,
    isAllSelected,
    selectedItemsCount,
    resetSelection,
    onAllRowsSelect,
    setSelectedRows,
  } = useTableSelection({
    data: issues.data,
    getId: (issue) => issue[ISSUE_HASH_KEY],
  });

  useEffect(() => {
    sendMessage({ type: "setPanelTitle", title: "Issues" });
  }, []);

  // Column visibility state
  const [columnConfig, setColumnConfig] = useLocalStorage(
    "issuesColumnVisibility",
    {
      title: true,
      sessions: true,
      lastSeen: true,
      createdAt: true,
      severity: true,
      component: true,
    }
  );

  useEffect(() => {
    const container = scrollContainer.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo(0, issuesStateRef.current.scrollTop || 0);
    });

    const handleScroll = () => {
      issuesStateRef.current.scrollTop = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    const container = scrollContainer.current;
    if (!container) return;

    container.scrollTo({ top: 0 });
    issuesStateRef.current.scrollTop = 0;
  }, [issuesStateRef]);

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

  const onPeriodChange = useCallback((period: IssueRateChartPeriod) => {
    setFilters((prev) => ({
      ...prev,
      skip: 0,
      period,
    }));
  }, []);

  const onSortingChange = useCallback((sorting) => {
    setFilters((prev) => ({
      ...prev,
      sorting,
      skip: 0,
    }));
  }, []);

  const handleColumnConfigChange = useCallback(
    (field: string, value: boolean) => {
      setColumnConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const columnConfigs = useMemo(
    () => [
      {
        field: "title",
        name: "Issue",
        sortable: true,
        width: "70%",
        minWidth: 320,
        component: (issue: IIssue) => <IssueInfo issue={issue} />,
      },
      {
        field: "sessions",
        name: "Events",
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
            <Box>Events</Box>
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
        component: ({ metrics }) => (
          <>
            {metrics?.[MetricName.ISSUE_RATE] &&
              metrics[MetricName.ISSUE_RATE].length > 0 && (
                <IssueRateChart
                  data={[
                    {
                      metricName: "Events",
                      series: metrics[MetricName.ISSUE_RATE],
                    },
                  ]}
                  period={filters.period}
                  width="full"
                  height={8}
                />
              )}
          </>
        ),
      },
      {
        field: "lastSeen",
        name: "Last seen",
        sortable: true,
        minWidth: 120,
        component: ({ lastSeen }) =>
          lastSeen ? <TimeAgo date={lastSeen} /> : "",
      },
      {
        field: "createdAt",
        name: "Created at",
        sortable: true,
        minWidth: 120,
        component: ({ createdAt }) => <TimeAgo date={createdAt} />,
      },
      {
        field: "severity",
        name: "Severity",
        minWidth: 120,
        sortable: true,
        component: (issue) => {
          return (
            <LazyRender onClick={(e) => e.stopPropagation()} cursor="pointer">
              <SeverityToggle
                value={issue.severity}
                showLabel={false}
                onChange={(value) => {
                  updateIssueSeverity(issue, value);
                }}
              />
            </LazyRender>
          );
        },
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

  return (
    <Flex
      pb="4"
      flex="1"
      minH="full"
      overflow="auto"
      direction="column"
      ref={scrollContainer}
    >
      <IssuesHeader />
      <Flex flex="1" gap="2" direction="column" px={{ base: "4", lg: "10" }}>
        {selectedItemsCount > 0 ? (
          <Flex
            py="2"
            top="0"
            w="full"
            zIndex="10"
            bg="bg.primary"
            position="sticky"
          >
            <BulkOperations
              selectedIds={selectedIds}
              selectedItemsCount={selectedItemsCount}
              isAllSelected={isAllSelected}
              hasFilters={hasFilters}
              resetSelection={resetSelection}
            />
          </Flex>
        ) : (
          <IssuesFilters filters={filters} setFilters={setFilters}>
            <ColumnConfigDropdown
              columns={columnConfigs}
              config={columnConfig}
              onChange={handleColumnConfigChange}
            />
          </IssuesFilters>
        )}

        <TableSimple
          data={issues.data}
          columns={columns}
          loading={loading}
          tableName="issues"
          usePagination={true}
          pageParams={filters as any}
          totalItemsCount={issues.cursor.total}
          noDataText={"No issues found"}
          useRowSelection={access.deleteSession}
          selectedRows={selectedRows}
          sorting={filters.sorting}
          tableWrapperOverflow="visible"
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRowClick={handleRowClick}
          onSortingChange={onSortingChange}
          onAllRowsSelect={onAllRowsSelect}
          setSelectedRows={setSelectedRows}
        />
      </Flex>
    </Flex>
  );
});

export default IssueList;
