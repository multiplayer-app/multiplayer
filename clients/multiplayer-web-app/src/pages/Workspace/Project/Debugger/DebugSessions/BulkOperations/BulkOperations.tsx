import { Icon, IconButton, Tooltip } from "@chakra-ui/react";
import pluralize from "pluralize";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { SessionType } from "@multiplayer-app/session-recorder-react";
import { DebugSessionCreationReasonType } from "@multiplayer/types";
import SelectionIndicator from "shared/components/SelectionIndicator";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useDebugSessions } from "shared/providers/DebugSessionsContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import useMessage from "shared/hooks/useMessage";
import { deleteDebugSessionsBulk } from "shared/services/radar.service";
import { TrashIcon } from "shared/icons";
import { calculateSkipAfterDeletion } from "shared/utils/paginationHelpers";

interface BulkOperationsProps {
  selectedIds: string[];
  selectedItemsCount: number;
  isAllSelected: boolean;
  resetSelection: () => void;
  onSessionsDelete?: () => void;
}

const BulkOperations = ({
  selectedIds,
  selectedItemsCount,
  isAllSelected,
  resetSelection,
  onSessionsDelete,
}: BulkOperationsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const message = useMessage();
  const { openAlertDialog } = useAlertDialog();
  const { workspaceId, projectId } = useParams();
  const { sessions, filters, setFilters } = useDebugSessions();
  const { withSandboxCheck } = useProjectSandbox();

  const getBulkDeletionBody = () => {
    if (!isAllSelected) {
      return { ids: selectedIds };
    }

    return {
      ...(filters.tags && { tags: filters.tags }),
      ...(filters.starred && { starred: filters.starred }),
      ...(filters.creationReason?.length && {
        creationReason: filters.creationReason
          .map((o) => o.value as DebugSessionCreationReasonType)
          .filter(Boolean),
      }),
      ...(filters.sessionType && {
        fromContinuousDebugSession:
          filters.sessionType === SessionType.CONTINUOUS,
      }),
    };
  };

  const deleteDebugSessions = async (ids: string[]) => {
    setIsLoading(true);
    try {
      await deleteDebugSessionsBulk(
        workspaceId,
        projectId,
        getBulkDeletionBody()
      );
      onSessionsDelete?.();

      const newSkip = calculateSkipAfterDeletion({
        isAllSelected,
        currentTotal: sessions.cursor.total,
        deletedCount: ids.length,
        currentSkip: filters.params.skip,
        pageSize: filters.params.limit,
      });

      setFilters((prev) => ({
        ...prev,
        params: { ...prev.params, skip: newSkip },
      }));
      resetSelection();
    } catch (error) {
      message.handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectionDelete = async () => {
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
          debug {pluralize("session", selectedItemsCount)}?
        </>
      ),
    });
    if (result) {
      deleteDebugSessions(selectedIds);
    }
  };

  return (
    <SelectionIndicator
      alignSelf="self-start"
      count={
        selectedItemsCount === sessions.data.length ? "All" : selectedItemsCount
      }
      onResetSelection={resetSelection}
      actionButtons={
        <Tooltip label="Delete selected items" openDelay={800}>
          <IconButton
            size="md"
            variant="ghost"
            aria-label="delete"
            borderLeftRadius="0"
            isDisabled={isLoading}
            onClick={withSandboxCheck(onSelectionDelete)}
          >
            <Icon color="muted" as={TrashIcon} />
          </IconButton>
        </Tooltip>
      }
    />
  );
};

export default BulkOperations;
