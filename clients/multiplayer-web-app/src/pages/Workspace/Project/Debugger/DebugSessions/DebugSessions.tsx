// React and routing
import { Flex, Icon, IconButton, Text, Tooltip } from "@chakra-ui/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RoleType,
  IDebugSession,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  DebugSessionCreationReasonType,
} from "@multiplayer/types";

// UI components
import Tag from "shared/components/Tag";
import TimeAgo from "shared/components/TimeAgo";
import ColumnConfigDropdown from "shared/components/ColumnConfigDropdown";
import DebugSessionTypeBadge from "shared/components/DebugSessionTypeBadge";

import {
  StarIcon,
  PlayIcon,
  RecordingIcon,
  StarFilledIcon,
} from "shared/icons";

// Local components
import BulkOperations from "./BulkOperations";
import DebugSessionsHeader from "./DebugSessionsHeader";
import { TableSimple } from "shared/components/Table";
import DebugSessionsFilters from "shared/components/DebugSessionsFilters";

// Context and hooks
import useLocalStorage from "shared/hooks/useLocalStorage";
import { usePermissions } from "shared/providers/PermissionsContext";
import { NavigationMode, useTabs } from "shared/providers/TabsContext";
import { useDebugSessions } from "shared/providers/DebugSessionsContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

// Services and utils
import { getDuration, getReporterName, stringifyTag } from "shared/utils";

import { ReactComponent as WebIcon } from "assets/icons/project/web.svg";
import { ReactComponent as IosIcon } from "assets/icons/project/ios.svg";
import { ReactComponent as MobileIcon } from "assets/icons/project/mobile.svg";
import { ReactComponent as AndroidIcon } from "assets/icons/project/android.svg";
import { WidthAccessCheck } from "shared/components/CheckAccess";
import DebugSessionPreviewDrawer from "../DebugSession/DebugSessionPreviewDrawer";
import { useVsCode } from "vscode/VsCodeContext";
import { SessionType } from "@multiplayer-app/session-recorder-react";
import { usePanelChatOpen } from "shared/components/AgentChat";

const SystemTypeIconMap = {
  mobile: MobileIcon,
  web: WebIcon,
  ios: IosIcon,
  android: AndroidIcon,
};

interface DebugSessionsProps {}
const defaultColumnConfig = {
  name: true,
  tags: true,
  reporter: true,
  duration: true,
  startedAt: true,
  sessionType: true,
  creationType: true,
};
const DebugSessions = memo((props: DebugSessionsProps) => {
  const { onSessionOpen } = useTabs();
  const { sendMessage } = useVsCode();
  const { hasAccess } = usePermissions();
  const isAgentChatOpen = usePanelChatOpen();
  const scrollContainer = useRef<HTMLDivElement>();
  const {
    sessions,
    loading,
    filters,
    sessionsStateRef,
    setFilters,
    updateSession,
  } = useDebugSessions();
  const { isSandbox } = useProjectSandbox();
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [previewSession, setPreviewSession] = useState<IDebugSession | null>(
    null
  );
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  // Column visibility state
  const [columnConfig, setColumnConfig] = useLocalStorage(
    "debugSessionsColumnVisibility",
    defaultColumnConfig
  );

  const selectedIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((k) => !!selectedRows[k])
      .map((index) => {
        return sessions.data[index]?._id;
      });
  }, [sessions.data, selectedRows]);

  const selectedItemsCount = selectedIds.length;

  useEffect(() => {
    const container = scrollContainer.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo(0, sessionsStateRef.current.scrollTop || 0);
    });

    const handleScroll = () => {
      sessionsStateRef.current.scrollTop = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isAgentChatOpen && previewSession) {
      setPreviewSession(null);
      // onSessionOpen(previewSession, NavigationMode.TABS);
    }
  }, [isAgentChatOpen, previewSession]);

  useEffect(() => {
    if (isAllSelected) {
      setSelectedRows(
        Object.fromEntries(sessions.data.map((_, index) => [index, true]))
      );
    }
  }, [sessions.data, isAllSelected]);

  const onTagsChange = useCallback(([key, value]) => {
    setFilters((prev) => ({
      ...prev,
      tags: Array.from(new Set([...prev.tags, stringifyTag([key, value])])),
      params: { ...prev.params, skip: 0 },
    }));
  }, []);

  const handleSortingChange = useCallback((sorting) => {
    setFilters((prev) => ({
      ...prev,
      sorting,
      params: { ...prev.params, skip: 0 },
    }));
  }, []);

  const handlePageChange = useCallback(
    (skip: number) => {
      setFilters((prev) => ({ ...prev, params: { ...prev.params, skip } }));
      scrollContainer.current?.scrollTo(0, 0);
    },
    [setFilters]
  );

  const handlePageSizeChange = useCallback(
    (limit: number) => {
      setFilters((prev) => ({
        ...prev,
        params: { ...prev.params, limit, skip: 0 },
      }));
      scrollContainer.current?.scrollTo(0, 0);
    },
    [setFilters]
  );

  const isFilterAndQueryEmpty = useMemo(
    () => !(filters.query || filters.tags.length > 0),
    [filters.query, filters.tags.length]
  );

  const resetSelection = useCallback(() => {
    setSelectedRows({});
    setIsAllSelected(false);
  }, []);

  useEffect(() => {
    sendMessage({ type: "setPanelTitle", title: "Sessions" });
  }, []);

  useEffect(() => {
    resetSelection();
  }, [filters.query, filters.tags.length, filters.sorting, resetSelection]);

  useEffect(() => {
    if (!isFilterAndQueryEmpty) {
      return;
    }
    if (sessions.data.length && selectedItemsCount === sessions.data.length) {
      setIsAllSelected(true);
    } else {
      if (
        sessions.data?.length === sessions.cursor.total ||
        sessions.data.length !== selectedItemsCount
      ) {
        setIsAllSelected(false);
      }
    }
  }, [
    isFilterAndQueryEmpty,
    selectedItemsCount,
    sessions.cursor.total,
    sessions.data?.length,
  ]);

  const handleAllRowsSelect = useCallback(
    (isSelected: boolean) => {
      if (isFilterAndQueryEmpty) {
        setIsAllSelected(isSelected);
      }

      const selection = isSelected
        ? Object.fromEntries(sessions.data.map((_, index) => [index, true]))
        : {};

      setSelectedRows(selection);
    },
    [sessions.data, filters.query, filters.tags.length]
  );

  const handleRowClick = (
    row: IDebugSession,
    e: React.MouseEvent<HTMLTableRowElement>
  ) => {
    if (e.metaKey || e.ctrlKey || isAgentChatOpen) {
      onSessionOpen(row, NavigationMode.TABS);
    } else {
      setPreviewSession(row);
    }
  };

  const handleOpenInNewTab = (e: React.MouseEvent<any>) => {
    if (!previewSession) return;
    const mode =
      e.metaKey || e.ctrlKey ? NavigationMode.NEW_TAB : NavigationMode.TABS;
    onSessionOpen(previewSession, mode);
  };

  const handleClosePreview = () => {
    setPreviewSession(null);
  };

  const onToggle = (session, starred) => {
    updateSession(session._id, { starred });
  };

  const handleColumnConfigChange = useCallback(
    (field: string, value: boolean) => {
      setColumnConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const components = useMemo<
    Record<(typeof configs)[number]["field"], (data: any) => React.ReactNode>
  >(
    () => ({
      name: (data) => {
        const { name, starred, stoppedAt } = data;
        const isStarred = typeof starred === "boolean" ? starred : false;
        return (
          <Flex alignItems="center" gap={2}>
            <WidthAccessCheck
              as={IconButton}
              scope={RoleType.PROJECT}
              permission={RoleAccessAction.UPDATE}
              entity={RoleProjectPermissionEntity.DEBUG_SESSION}
              bypassPermissions={isSandbox}
              size="xs"
              variant="base"
              aria-label="star"
              icon={
                isStarred ? (
                  <Icon as={StarFilledIcon} color="yellow.500" boxSize="22px" />
                ) : (
                  <Icon as={StarIcon} color="muted" />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggle(data, !isStarred);
              }}
            />

            <Icon as={!stoppedAt ? RecordingIcon : PlayIcon} />
            <Text as="span" noOfLines={2} py="1" title={name}>
              {name}
            </Text>
          </Flex>
        );
      },
      sessionType: ({
        sessionType,
        creationReason,
        continuousDebugSession,
      }) => {
        return (
          <DebugSessionTypeBadge
            sessionType={
              continuousDebugSession
                ? SessionType.CONTINUOUS
                : sessionType
                ? sessionType
                : creationReason === DebugSessionCreationReasonType.ISSUE
                ? SessionType.SESSION_CACHE
                : SessionType.MANUAL
            }
          />
        );
      },
      creationType: ({ creationReason, creationType }) => {
        return (
          <DebugSessionTypeBadge
            creationType={creationReason || creationType}
          />
        );
      },
      reporter: ({ sessionAttributes, userAttributes }) => (
        <Text as="span" whiteSpace="nowrap">
          {getReporterName({ userAttributes, sessionAttributes })}
        </Text>
      ),
      duration: ({ startedAt, stoppedAt }) => (
        <>{getDuration(startedAt, stoppedAt)}</>
      ),
      startedAt: ({ startedAt }) => <TimeAgo date={startedAt} />,
      tags: ({ tags = [] }) => {
        const t = tags || [];
        const visibleTags = t.slice(0, 1);
        const remainingTags = t.slice(1);
        return tags ? (
          <Flex gap="1" flexWrap="nowrap" py="1">
            {visibleTags.map((tag: any) => {
              const { key, value } = Array.isArray(tag)
                ? { key: tag[0], value: tag[1] }
                : tag;
              const tagName = `${key ? key + ":" : ""}${value}`;
              return (
                <Tag
                  size="sm"
                  key={key + value}
                  name={tagName}
                  maxW="100px"
                  overflow="hidden"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  onClick={() => onTagsChange([key, value])}
                />
              );
            })}
            {remainingTags.length > 0 && (
              <Tooltip label={remainingTags.map((t) => t.value).join(", ")}>
                <Tag size="sm" name={`+${remainingTags.length}`} />
              </Tooltip>
            )}
          </Flex>
        ) : null;
      },
      platform: ({ resourceAttributes }) => {
        const deviceInfo = resourceAttributes?.["deviceInfo"];
        const systemType = resourceAttributes?.["systemType"] || "web";
        return (
          <>
            <Tooltip label={deviceInfo}>
              <Icon as={SystemTypeIconMap[systemType]} />
            </Tooltip>
          </>
        );
      },
    }),
    [onTagsChange]
  );

  // Filter columns based on visibility
  const columns = useMemo(() => {
    return configs.reduce((acc, column) => {
      if (columnConfig[column.field] !== false) {
        acc.push({ ...column, component: components[column.field] });
      }
      return acc;
    }, []);
  }, [components, columnConfig]);

  const access = useMemo(() => {
    return {
      deleteSession: hasAccess(
        RoleProjectPermissionEntity.DEBUG_SESSION,
        RoleAccessAction.DELETE,
        RoleType.PROJECT
      ),
    };
  }, [hasAccess]);

  return (
    <Flex
      pb="4"
      flex="1"
      minH="full"
      overflow="auto"
      direction="column"
      ref={scrollContainer}
    >
      <DebugSessionsHeader />
      <Flex flex="1" gap="2" direction="column" px={{ base: "4", lg: "10" }}>
        {selectedItemsCount > 0 ? (
          <Flex
            py="2"
            top="0"
            w="full"
            zIndex="10"
            bg="bg.primary"
            position={{ base: "static", md: "sticky" }}
          >
            <BulkOperations
              selectedIds={selectedIds}
              isAllSelected={isAllSelected}
              resetSelection={resetSelection}
              selectedItemsCount={selectedItemsCount}
            />
          </Flex>
        ) : (
          <DebugSessionsFilters filters={filters} setFilters={setFilters}>
            <ColumnConfigDropdown
              columns={configs}
              config={columnConfig}
              onChange={handleColumnConfigChange}
            />
          </DebugSessionsFilters>
        )}

        <TableSimple
          data={sessions.data}
          columns={columns}
          loading={loading}
          tableName="debugSessions"
          usePagination={true}
          tableWrapperOverflow="visible"
          stickyHeaderTop="0"
          sorting={filters.sorting}
          pageParams={filters.params}
          highlightedRow={previewSession?._id}
          useRowSelection={access.deleteSession}
          totalItemsCount={sessions.cursor.total}
          selectedRows={selectedRows}
          onRowClick={handleRowClick}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          setSelectedRows={setSelectedRows}
          onSortingChange={handleSortingChange}
          onAllRowsSelect={handleAllRowsSelect}
          noDataText={
            isFilterAndQueryEmpty
              ? "You don't have any debug sessions yet!"
              : "No results found"
          }
        />
      </Flex>
      <DebugSessionPreviewDrawer
        sessionId={previewSession?._id}
        containerRef={scrollContainer}
        onClose={handleClosePreview}
        onOpenInNewTab={handleOpenInNewTab}
      />
    </Flex>
  );
});

// clear previous storage (oldTableName + "Sizes")
localStorage.removeItem("debuggerSizes");

const configs = [
  {
    field: "name",
    name: "Session",
    width: "55%",
    minWidth: "400px",
    sortable: true,
  },
  {
    field: "sessionType",
    name: "Recording Mode",
    minWidth: 140,
    sortable: true,
  },
  {
    field: "creationType",
    name: "Creation Type",
    minWidth: 120,
    sortable: true,
  },
  {
    field: "reporter",
    name: "Reporter",
    width: 200,
    sortable: false,
  },
  {
    field: "duration",
    name: "Duration",
    width: 90,
    sortable: false,
  },
  {
    field: "startedAt",
    name: "Created at",
    minWidth: 110,
    sortable: true,
  },
  {
    field: "tags",
    name: "Tags",
    minWidth: 90,
  },
  {
    field: "platform",
    name: "Device",
    minWidth: 90,
  },
];

export default DebugSessions;
