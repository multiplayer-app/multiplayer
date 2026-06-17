import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

// UI components
import { Box, Flex, Icon, IconButton, Text, Tooltip } from "@chakra-ui/react";
import { TableSimple as Table } from "shared/components/Table";
import { PlayIcon, RecordingIcon, TrashIcon } from "shared/icons";
import SelectionIndicator from "shared/components/SelectionIndicator";

// Context and hooks
import { useAlertDialog } from "shared/providers/AlertDialogContext";

// Services and utils
import { getDuration, getReporterName } from "shared/utils";
import {
  getDebugSessions,
  deleteDebugSessionsBulk,
} from "shared/services/radar.service";
import {
  IDebugSession,
  IEndUser,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import useMessage from "shared/hooks/useMessage";
import TimeAgo from "shared/components/TimeAgo";
import { usePermissions } from "shared/providers/PermissionsContext";
import DebugSessionTypeBadge from "shared/components/DebugSessionTypeBadge";
import { SessionType } from "@multiplayer-app/session-recorder-react";
import { IListRes, ITableSorting } from "shared/models/interfaces";

import {
  getCombinedFilters,
  useDebugSessionsFilters,
} from "shared/hooks/useDebugSessionsFilters";
import DebugSessionsFilters from "shared/components/DebugSessionsFilters";
import { useEventSubscription } from "shared/hooks/useEventSubscription";
import { ProjectSourceType } from "shared/models/enums";

interface ISessionsListProps {
  baseFilters: any;
  collapseFiltersOnBase?: boolean;
  user?: IEndUser;
  onRowClick: (
    { type, data }: { type: string; data: IDebugSession },
    e: React.MouseEvent<HTMLTableRowElement>
  ) => void;
}

type RealtimeSessionUpdate =
  | IDebugSession
  | {
      action: "upsert" | "delete";
      session: IDebugSession;
    };

const SessionsList = memo(
  ({
    user,
    baseFilters,
    collapseFiltersOnBase = false,
    onRowClick,
  }: ISessionsListProps) => {
    const message = useMessage();
    const { hasAccess } = usePermissions();
    const { openAlertDialog } = useAlertDialog();
    const scrollContainer = useRef<HTMLDivElement>();
    const { workspaceId, projectId, sourceType } = useParams<{
      workspaceId?: string;
      projectId?: string;
      branchId?: string;
      sourceType?: ProjectSourceType;
    }>();

    // Local state for issue sessions
    const [sessions, setSessions] = useState<IListRes<IDebugSession>>({
      data: [],
      cursor: {
        total: 0,
        skip: 0,
        limit: 20,
      },
    });
    const [loading, setLoading] = useState(true);
    const { filters, setFilters } = useDebugSessionsFilters();
    const [selectedRows, setSelectedRows] = useState<{
      [key: string]: boolean;
    }>({});
    const [isAllSelected, setIsAllSelected] = useState(false);

    const normalizePayload = (
      payload: RealtimeSessionUpdate
    ): { action: "upsert" | "delete"; session: IDebugSession } | null => {
      if (!payload) {
        return null;
      }

      if ("session" in payload) {
        return payload;
      }

      if (payload?._id) {
        return {
          action: "upsert",
          session: payload,
        };
      }

      return null;
    };

    const updateSessions = useCallback((payload: RealtimeSessionUpdate) => {
      const normalized = normalizePayload(payload);
      if (
        !normalized?.session?._id ||
        ("session" in payload && user._id !== payload?.session._id)
      )
        return;

      const { action, session } = normalized;

      setSessions((prev) => {
        if (action === "delete") {
          return {
            ...prev,
            cursor: {
              ...prev.cursor,
              total: Math.max(0, prev.cursor.total - 1),
            },
            data: prev.data.filter((item) => item._id !== session._id),
          };
        }

        const hasExisting = prev.data.some((item) => item._id === session._id);

        if (hasExisting) {
          return {
            ...prev,
            data: prev.data.map((item) =>
              item._id === session._id ? { ...item, ...session } : item
            ),
          };
        }

        return {
          ...prev,
          cursor: {
            ...prev.cursor,
            total: prev.cursor.total + 1,
          },
          data: [session, ...prev.data],
        };
      });
    }, []);

    useEventSubscription(ProjectSourceType.DEBUGGER, null, updateSessions, []);

    // Fetch issue sessions
    const getSessionsFn = useCallback(async () => {
      try {
        setLoading(true);
        const params = {
          ...baseFilters,
          ...getCombinedFilters(filters),
        };
        const res = await getDebugSessions(workspaceId, projectId, params);
        setSessions((prev) => ({
          cursor: res.cursor,
          data: params.skip ? [...prev.data, ...res.data] : res.data,
        }));
      } catch (err) {
        console.error("Error fetching issue sessions:", err);
        message.handleError(err);
      } finally {
        setLoading(false);
      }
    }, [workspaceId, projectId, baseFilters, filters, message]);

    useEffect(() => {
      getSessionsFn();
    }, [getSessionsFn]);

    // Helper functions for selection management
    const selectedIds = useMemo(() => {
      return Object.keys(selectedRows)
        .filter((k) => !!selectedRows[k])
        .map((index) => {
          return sessions.data[parseInt(index)]?._id;
        })
        .filter(Boolean);
    }, [sessions.data, selectedRows]);

    const selectedItemsCount = selectedIds.length;

    const resetSelection = () => {
      setSelectedRows({});
      setIsAllSelected(false);
    };

    useEffect(() => {
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
    }, [selectedItemsCount, sessions.cursor.total, sessions.data?.length]);

    const handleAllRowsSelect = useCallback(
      (isSelected: boolean) => {
        setIsAllSelected(isSelected);

        const selection = isSelected
          ? Object.fromEntries(sessions.data.map((_, index) => [index, true]))
          : {};

        setSelectedRows(selection);
      },
      [sessions.data]
    );

    const handleScrollEnd = useCallback(() => {
      if (loading) return;
      const { params } = filters;
      if (params.skip + params.limit < sessions.cursor.total) {
        setFilters((prev) => ({
          ...prev,
          params: { ...prev.params, skip: prev.params.skip + params.limit },
        }));
      }
    }, [loading, filters, sessions.cursor.total]);

    // Handle sorting change
    const handleSortingChange = useCallback((sorting: ITableSorting | null) => {
      setFilters((prev) => ({ ...prev, sorting, skip: 0 }));
      setSelectedRows({});
    }, []);

    // Get bulk deletion body based on selection type
    const getBulkDeletionBody = () => {
      if (!isAllSelected) {
        return { ids: selectedIds };
      }

      return {
        ...getCombinedFilters(filters, false),
        ...baseFilters,
      };
    };

    // Main deletion function
    const deleteDebugSessions = async (ids: string[]) => {
      try {
        const body = getBulkDeletionBody();
        await deleteDebugSessionsBulk(workspaceId, projectId, body);

        // Optimistic state update
        setSessions((prev) => ({
          ...prev,
          data: isAllSelected
            ? []
            : prev.data.filter((session) => !ids.includes(session._id)),
          cursor: {
            ...prev.cursor,
            total: isAllSelected ? 0 : prev.cursor.total - ids.length,
          },
        }));

        message.success(
          `${
            isAllSelected ? sessions.cursor.total : ids.length
          } sessions deleted successfully`
        );
      } catch (error) {
        message.handleError(error);
      } finally {
        if (isAllSelected) {
          setFilters((prev) => ({ ...prev, skip: 0 }));
        }
        resetSelection();
      }
    };

    // Handle bulk deletion of selected sessions
    const handleBulkDelete = async () => {
      if (selectedItemsCount === 0) return;

      const result = await openAlertDialog({
        title: "Deleting debug sessions",
        description: (
          <>
            Are you sure you want to delete{" "}
            <b>
              {isAllSelected
                ? `all (${sessions.cursor.total})`
                : selectedItemsCount}
            </b>{" "}
            debug session{selectedItemsCount !== 1 ? "s" : ""}?
          </>
        ),
      });
      if (result) {
        deleteDebugSessions(selectedIds);
      }
    };

    const handleRowClick = (
      row: IDebugSession,
      e: React.MouseEvent<HTMLTableRowElement>
    ) => {
      onRowClick({ type: "session", data: row }, e);
    };

    const access = useMemo(() => {
      return {
        deleteSession: hasAccess(
          RoleProjectPermissionEntity.DEBUG_SESSION,
          RoleAccessAction.DELETE,
          RoleType.PROJECT
        ),
      };
    }, [hasAccess]);

    const components = useMemo<
      Record<(typeof configs)[number]["field"], (data: any) => React.ReactNode>
    >(
      () => ({
        name: (data) => {
          const { name, stoppedAt } = data;
          return (
            <Flex alignItems="center" gap={2}>
              <Icon as={!stoppedAt ? RecordingIcon : PlayIcon} />
              <Text as="span" noOfLines={1} title={name}>
                {name}
              </Text>
            </Flex>
          );
        },
        sessionType: ({ sessionType, continuousDebugSession }) => {
          return (
            <DebugSessionTypeBadge
              sessionType={
                continuousDebugSession
                  ? SessionType.CONTINUOUS
                  : sessionType || SessionType.SESSION_CACHE
              }
            />
          );
        },
        reporter: ({ sessionAttributes, userAttributes }) => (
          <>{getReporterName({ userAttributes, sessionAttributes })}</>
        ),
        duration: ({ startedAt, stoppedAt }) => (
          <>{getDuration(startedAt, stoppedAt)}</>
        ),
        startedAt: ({ startedAt }) => <TimeAgo date={startedAt} />,
        device: ({ resourceAttributes }) => (
          <>{resourceAttributes?.deviceInfo}</>
        ),
      }),
      [access.deleteSession]
    );

    const columns = useMemo(() => {
      return configs.map((column) => ({
        ...column,
        component: components[column.field],
      }));
    }, [components]);

    return (
      <Flex flex="1" direction="column" ref={scrollContainer}>
        <Flex flex="1" gap="2" direction="column">
          {/* Selection indicator for bulk actions */}
          {selectedItemsCount > 0 ? (
            <Box py="2" alignSelf="flex-start">
              <SelectionIndicator
                count={selectedItemsCount}
                onResetSelection={resetSelection}
                actionButtons={
                  <Tooltip label="Delete selected sessions" openDelay={800}>
                    <IconButton
                      size="md"
                      variant="ghost"
                      aria-label="delete selected"
                      borderLeftRadius="0"
                      onClick={handleBulkDelete}
                    >
                      <Icon color="muted" as={TrashIcon} />
                    </IconButton>
                  </Tooltip>
                }
              />
            </Box>
          ) : (
            <DebugSessionsFilters
              filters={filters}
              setFilters={setFilters}
              collapseOnBase={collapseFiltersOnBase}
            />
          )}

          <Table
            data={sessions.data}
            columns={columns}
            loading={loading}
            useInfiniteScrolling={true}
            noDataText={
              sourceType === ProjectSourceType.END_USERS
                ? "No sessions found for this user"
                : "No sessions found for this issue"
            }
            sorting={filters.sorting}
            pageParams={filters.params}
            selectedRows={selectedRows}
            useRowSelection={access.deleteSession}
            totalItemsCount={sessions.cursor.total}
            setSelectedRows={setSelectedRows}
            onRowClick={handleRowClick}
            onScrollEnd={handleScrollEnd}
            onAllRowsSelect={handleAllRowsSelect}
            onSortingChange={handleSortingChange}
          />
        </Flex>
      </Flex>
    );
  }
);

const configs = [
  {
    field: "name",
    name: "Session",
    minWidth: "300px",
    sortable: true,
  },
  {
    field: "sessionType",
    name: "Type",
    sortable: false,
  },
  {
    field: "duration",
    name: "Duration",
    sortable: true,
  },
  {
    field: "startedAt",
    name: "Created at",
    sortable: true,
  },
  {
    field: "device",
    name: "Device",
    sortable: true,
  },
];

export default SessionsList;
