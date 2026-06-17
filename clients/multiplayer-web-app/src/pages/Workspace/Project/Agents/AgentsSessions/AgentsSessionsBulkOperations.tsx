import { useState, type Dispatch, type SetStateAction } from "react";
import { Icon } from "@chakra-ui/react";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import IconButton from "shared/components/IconButton";
import SelectionIndicator from "shared/components/SelectionIndicator";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useParams } from "react-router-dom";
import useMessage from "shared/hooks/useMessage";
import {
  deleteAgentChatsBulk,
  updateAgentChatsBulk,
} from "shared/services/radar.service";
import { ArchiveIcon, TrashOIcon } from "shared/icons";
import { calculateSkipAfterDeletion } from "shared/utils/paginationHelpers";

import { getAgentSessionsBulkFilter } from "./agentsSessionsBulkHelpers";

interface AgentsSessionsBulkOperationsProps {
  selectedIds: string[];
  selectedItemsCount: number;
  isAllSelected: boolean;
  resetSelection: () => void;
  totalFromServer: number;
  page: number;
  pageSize: number;
  setPageParams: Dispatch<SetStateAction<{ page: number; pageSize: number }>>;
  refetchSessions: () => Promise<unknown>;
  isArchived: boolean;
}

const AgentsSessionsBulkOperations = ({
  selectedIds,
  selectedItemsCount,
  isAllSelected,
  resetSelection,
  totalFromServer,
  page,
  pageSize,
  setPageParams,
  refetchSessions,
  isArchived,
}: AgentsSessionsBulkOperationsProps) => {
  const message = useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const { openAlertDialog } = useAlertDialog();
  const { workspaceId, projectId } = useParams();
  const { hasAccess } = usePermissions();

  const canDelete = hasAccess(
    RoleProjectPermissionEntity.AGENT_CHAT,
    RoleAccessAction.DELETE,
    RoleType.PROJECT
  );

  const canUpdate = hasAccess(
    RoleProjectPermissionEntity.AGENT_CHAT,
    RoleAccessAction.UPDATE,
    RoleType.PROJECT
  );

  const afterMutation = async (deletedCount: number) => {
    await refetchSessions();
    const currentSkip = (page - 1) * pageSize;
    const newSkip = calculateSkipAfterDeletion({
      isAllSelected,
      currentTotal: totalFromServer,
      deletedCount,
      currentSkip,
      pageSize,
    });
    setPageParams((p) => ({
      ...p,
      page: Math.floor(newSkip / p.pageSize) + 1,
    }));
    resetSelection();
  };

  const deleteSessions = async (
    body: ReturnType<typeof getAgentSessionsBulkFilter>
  ) => {
    if (!workspaceId || !projectId) return;
    setIsLoading(true);
    try {
      await deleteAgentChatsBulk(workspaceId, projectId, body);
      message.success(`${body.ids.length} session(s) deleted`);
      await afterMutation(body.ids.length);
    } catch (e) {
      message.handleError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const body = getAgentSessionsBulkFilter(selectedIds);
    if (!body.ids?.length) return;

    const confirmed = await openAlertDialog({
      title: "Delete sessions",
      description: (
        <>
          Delete{" "}
          <b>
            {isAllSelected ? `all (${totalFromServer})` : body.ids.length}{" "}
            session{body.ids.length !== 1 ? "s" : ""}
          </b>
          ? This cannot be undone.
        </>
      ),
      confirmBtnLabel: "Delete",
    });

    if (confirmed) {
      await deleteSessions(body);
    }
  };

  const handleBulkArchive = async () => {
    if (!workspaceId || !projectId) return;
    const filter = getAgentSessionsBulkFilter(selectedIds);
    if (!filter.ids?.length) return;
    setIsLoading(true);
    try {
      await updateAgentChatsBulk(workspaceId, projectId, filter, {
        archived: !isArchived,
      });
      message.success(
        `${filter.ids.length} session(s) ${isArchived ? "unarchived" : "archived"}`
      );
      await refetchSessions();
      resetSelection();
    } catch (e) {
      message.handleError(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canDelete && !canUpdate) {
    return null;
  }

  return (
    <SelectionIndicator
      alignSelf="flex-start"
      count={isAllSelected ? "All" : selectedItemsCount}
      onResetSelection={resetSelection}
      actionButtons={
        <>
          {canDelete && (
            <IconButton
              size="md"
              variant="ghost"
              color="muted"
              aria-label="delete selected"
              borderRadius="0"
              label="Delete selected sessions"
              isDisabled={isLoading}
              onClick={handleBulkDelete}
              icon={<Icon as={TrashOIcon} />}
            />
          )}
          {canUpdate && (
            <IconButton
              size="md"
              variant="ghost"
              color="muted"
              aria-label={isArchived ? "unarchive selected" : "archive selected"}
              borderRadius="0"
              label={isArchived ? "Unarchive selected sessions" : "Archive selected sessions"}
              isDisabled={isLoading}
              onClick={handleBulkArchive}
              icon={<Icon as={ArchiveIcon} />}
            />
          )}
        </>
      }
    />
  );
};

export default AgentsSessionsBulkOperations;
