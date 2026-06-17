import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import {
  AgentStatus,
  IAgentChat,
  type IAgent,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
  AgentType,
} from "@multiplayer/types";

import useLocalStorage from "shared/hooks/useLocalStorage";
import useTableSelection from "shared/hooks/useTableSelection";
import TimeAgo from "shared/components/TimeAgo";
import PageLoading from "shared/components/PageLoading";
import TableSimple from "shared/components/Table/TableSimple";
import ColumnConfigDropdown from "shared/components/ColumnConfigDropdown";

import { usePermissions } from "shared/providers/PermissionsContext";

import AgentsHeader from "../AgentsHeader";
import AgentSessionInfo from "../AgentSessionInfo";
import { SessionStatusTag, SessionTypeTag } from "../SessionTags";
import { AgentSessionPreviewDrawer } from "../AgentDetails";
import { useAgentSessions } from "../AgentSessionsContext";
import AgentsSessionsBulkOperations from "./AgentsSessionsBulkOperations";
import AgentsSessionsFilters from "./AgentsSessionsFilters";

import { AGENT_STATUS_COLOR_MAP, AGENT_TYPE_LABELS } from "../agents.constants";
import { useParams } from "react-router";
import useMessage from "shared/hooks/useMessage";
import { createAgentChat } from "shared/services/radar.service";

interface AgentsSessionsProps {
  agents: IAgent[];
  onSessionOpen: (session: IAgentChat) => void;
}

const AgentsSessions = ({ agents, onSessionOpen }: AgentsSessionsProps) => {
  const message = useMessage();
  const { hasAccess } = usePermissions();
  const { workspaceId, projectId } = useParams();
  const {
    sessions: sessionsData,
    loading,
    filters,
    setFilters,
    pageParams,
    setPageParams,
    fetchSessions,
  } = useAgentSessions();

  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const scrollContainer = useRef<HTMLDivElement | null>(null);

  const [columnConfig, setColumnConfig] = useLocalStorage(
    "agentSessionsColumnVisibility",
    {
      title: true,
      worker: true,
      type: true,
      status: true,
      updatedAt: true,
    }
  );

  const sessions = sessionsData.data;
  const sessionsCursor = sessionsData.cursor;

  const workerById = useMemo(() => {
    return agents.reduce<Record<string, IAgent>>((acc, worker) => {
      acc[worker._id] = worker;
      return acc;
    }, {});
  }, [agents]);

  const {
    selectedIds,
    selectedRows,
    isAllSelected,
    selectedItemsCount,
    setSelectedRows,
    onAllRowsSelect,
    resetSelection,
  } = useTableSelection({
    data: sessions,
    getId: (row) => row?._id || row?.id || null,
  });

  useEffect(() => {
    resetSelection();
  }, [pageParams.page, pageParams.pageSize, resetSelection]);

  const canSelectRows = useMemo(
    () =>
      hasAccess(
        RoleProjectPermissionEntity.AGENT_CHAT,
        RoleAccessAction.DELETE,
        RoleType.PROJECT
      ),
    [hasAccess]
  );

  const handleColumnConfigChange = useCallback(
    (field: string, value: boolean) => {
      setColumnConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setColumnConfig]
  );

  const columnConfigs = useMemo(
    () => [
      {
        field: "title",
        name: "Session",
        component: (session: IAgentChat) => (
          <AgentSessionInfo py="2" session={session} titleVariant="table" />
        ),
      },
      {
        field: "worker",
        name: "Worker",
        component: (session: IAgentChat) => {
          const worker = workerById[session.agent];
          const type = session.agentType ?? worker?.type;
          const name = session.agentName ?? worker?.name;
          return (
            <>
              <Flex alignItems="center" gap="2">
                <Box
                  my="1"
                  as="span"
                  width="0.5"
                  alignSelf="stretch"
                  borderRadius="full"
                  bg={
                    worker?.issuesInProgress > 0
                      ? AGENT_STATUS_COLOR_MAP[AgentStatus.RUNNING]
                      : AGENT_STATUS_COLOR_MAP[AgentStatus.IDLE]
                  }
                />
                <Stack gap="0.5" minW="0" flex="1">
                  <Text fontSize="xs">{AGENT_TYPE_LABELS[type] ?? type}</Text>
                  <Text
                    fontSize="xs"
                    color="muted"
                    fontFamily="mono"
                    noOfLines={1}
                    whiteSpace="nowrap"
                    maxW="220px"
                  >
                    {name}
                  </Text>
                </Stack>
              </Flex>
            </>
          );
        },
      },
      {
        field: "type",
        name: "Type",
        width: "90px",
        component: (session: IAgentChat) => (
          <SessionTypeTag type={session?.type} />
        ),
      },
      {
        field: "status",
        name: "Status",
        width: "110px",
        component: (session: IAgentChat) => (
          <SessionStatusTag status={session?.status} />
        ),
      },
      {
        field: "updatedAt",
        name: "Updated",
        width: "120px",
        component: (session: IAgentChat) => {
          const updatedAt = session?.updatedAt ?? session?.createdAt;
          return updatedAt ? <TimeAgo date={updatedAt} /> : "";
        },
      },
    ],
    [workerById]
  );

  const columns = useMemo(() => {
    return columnConfigs.reduce<typeof columnConfigs>((acc, column) => {
      if (columnConfig[column.field] !== false) {
        acc.push(column);
      }
      return acc;
    }, []);
  }, [columnConfigs, columnConfig]);

  const tablePageParams = useMemo(
    () => ({
      skip: (pageParams.page - 1) * pageParams.pageSize,
      limit: pageParams.pageSize,
    }),
    [pageParams]
  );

  const handleRowClick = (row: IAgentChat) => {
    setPreviewSessionId(row._id);
  };

  const handleOpenInNewTab = (_e: React.MouseEvent<any>) => {
    if (!previewSessionId) return;
    onSessionOpen(
      (sessions || []).find((s) => s._id === previewSessionId) as IAgentChat
    );
  };

  const handleClosePreview = () => {
    setPreviewSessionId(null);
  };

  const handleCreateChat = async () => {
    if (!workspaceId || !projectId) return;
    try {
      const created = await createAgentChat(workspaceId, projectId, {
        agentType: AgentType.DEBUGGING,
      });
      const createdId =
        (created as any)?._id ??
        (created as any)?.id ??
        (created as any)?.chatId ??
        "";

      await fetchSessions();

      if (createdId) {
        setPreviewSessionId(String(createdId));
      }

      onSessionOpen(created as IAgentChat);
    } catch (e) {
      message.handleError(e);
    }
  };

  return (
    <Box bg="bg.primary" ref={scrollContainer}>
      <AgentsHeader workers={agents} onCreateChat={handleCreateChat} />
      {loading && !sessions.length ? (
        <PageLoading />
      ) : (
        <Box flex="1" minH="0" px={{ base: "4", lg: "10" }}>
          {selectedItemsCount > 0 ? (
            <Flex
              py="2"
              top="0"
              w="full"
              zIndex={10}
              bg="bg.primary"
              position="sticky"
            >
              <AgentsSessionsBulkOperations
                selectedIds={selectedIds}
                selectedItemsCount={selectedItemsCount}
                isAllSelected={isAllSelected}
                resetSelection={resetSelection}
                totalFromServer={sessionsCursor.total}
                page={pageParams.page}
                pageSize={pageParams.pageSize}
                setPageParams={setPageParams}
                refetchSessions={fetchSessions}
                isArchived={!!filters.archived}
              />
            </Flex>
          ) : (
            <AgentsSessionsFilters
              filters={filters}
              setFilters={setFilters}
              agents={agents}
            >
              <ColumnConfigDropdown
                columns={columnConfigs}
                config={columnConfig}
                onChange={handleColumnConfigChange}
              />
            </AgentsSessionsFilters>
          )}

          <TableSimple
            data={sessions}
            columns={columns}
            tableName="workerSessions"
            usePagination
            tableWrapperHeight="auto"
            pageParams={tablePageParams}
            totalItemsCount={sessionsCursor.total}
            noDataText="No sessions found"
            onRowClick={handleRowClick}
            onPageChange={(skip) =>
              setPageParams((prev) => ({
                ...prev,
                page: Math.floor(skip / prev.pageSize) + 1,
              }))
            }
            onPageSizeChange={(limit) =>
              setPageParams({ page: 1, pageSize: limit })
            }
            loading={loading}
            selectedRows={selectedRows}
            useRowSelection={canSelectRows}
            highlightedRow={previewSessionId}
            setSelectedRows={setSelectedRows}
            onAllRowsSelect={onAllRowsSelect}
          />
        </Box>
      )}
      <AgentSessionPreviewDrawer
        sessionId={previewSessionId as string}
        containerRef={scrollContainer}
        onClose={handleClosePreview}
        onOpenInNewTab={handleOpenInNewTab}
      />
    </Box>
  );
};

export default AgentsSessions;
