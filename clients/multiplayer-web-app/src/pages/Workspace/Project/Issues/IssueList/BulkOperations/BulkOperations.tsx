import { Icon } from "@chakra-ui/react";
import IconButton from "shared/components/IconButton";
import SelectionIndicator from "shared/components/SelectionIndicator";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import {
  deleteIssuesBulk,
  updateIssuesBulk,
} from "shared/services/radar.service";
import { useParams } from "react-router-dom";
import useMessage from "shared/hooks/useMessage";
import { useIssues } from "shared/providers/IssuesContext";
import { getBulkOperationsConfig } from "./bulkOperationsConfig";
import { createAlertDialogContent } from "./alertDialogHelpers";
import {
  getBulkOperationBody,
  getBulkOperationFilters,
  getOperationCount,
  getSuccessMessage,
} from "./bulkOperationHelpers";
import { SeverityToggle } from "../../Severity";
import { IssueSeverityLevel } from "@multiplayer/types";
import { IssuesBulkOperationPayload } from "shared/models/interfaces";
import { useState } from "react";
import { calculateSkipAfterDeletion } from "shared/utils/paginationHelpers";

interface BulkOperationsProps {
  selectedIds: string[];
  selectedItemsCount: number;
  isAllSelected: boolean;
  hasFilters: boolean;
  resetSelection: () => void;
}

const BulkOperations = ({
  selectedIds,
  selectedItemsCount,
  isAllSelected,
  resetSelection,
}: BulkOperationsProps) => {
  const message = useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const { openAlertDialog } = useAlertDialog();
  const { workspaceId, projectId } = useParams();
  const { issues, filters, hasFilters, setFilters } = useIssues();

  const deleteIssues = async () => {
    setIsLoading(true);
    try {
      const body = {
        ...getBulkOperationBody(selectedIds, isAllSelected, hasFilters),
        ...getBulkOperationFilters(filters),
      };
      await deleteIssuesBulk(workspaceId, projectId, body);

      const newSkip = calculateSkipAfterDeletion({
        isAllSelected,
        currentTotal: issues.cursor.total,
        deletedCount: selectedIds.length,
        currentSkip: filters.skip,
        pageSize: filters.limit,
      });

      setFilters((prev) => ({ ...prev, skip: newSkip }));
      const count = getOperationCount(body, issues);
      message.success(getSuccessMessage(count, "delete"));
      resetSelection();
    } catch (error) {
      message.handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIssues = async (payload: IssuesBulkOperationPayload) => {
    setIsLoading(true);
    try {
      const filter = {
        ...getBulkOperationBody(selectedIds, isAllSelected, hasFilters),
        ...getBulkOperationFilters(filters),
      };
      await updateIssuesBulk(workspaceId, projectId, { filter, payload });
      setFilters((prev) => ({ ...prev, skip: 0 }));
      const count = getOperationCount(filter, issues);
      message.success(getSuccessMessage(count, "update"));
      resetSelection();
    } catch (error) {
      message.handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const bulkOperationsConfig = getBulkOperationsConfig(filters);

  const handleBulkOperation = async (operationKey: string) => {
    const config = bulkOperationsConfig.find((op) => op.key === operationKey);
    if (!config) return;

    const { title, description } = createAlertDialogContent(
      config.action,
      selectedItemsCount,
      isAllSelected,
      hasFilters,
      issues.cursor.total
    );

    const result = await openAlertDialog({
      title,
      description,
      confirmBtnLabel: config.action,
    });

    if (result) {
      if (operationKey === "delete") {
        await deleteIssues();
      } else if (config.payload) {
        await updateIssues(config.payload);
      }
    }
  };

  const handleSeverityChange = async (severity: IssueSeverityLevel) => {
    const result = await openAlertDialog({
      title: "Update issues severity",
      description:
        "Are you sure you want to update the severity of the selected issues?",
      confirmBtnLabel: "Update",
    });

    if (result) {
      updateIssues({ severity });
    }
  };

  return (
    <SelectionIndicator
      alignSelf="self-start"
      count={
        selectedItemsCount === issues.data.length ? "All" : selectedItemsCount
      }
      onResetSelection={resetSelection}
      actionButtons={
        <>
          {bulkOperationsConfig.map((config) => (
            <IconButton
              key={config.key}
              size="md"
              variant="ghost"
              color="muted"
              aria-label={config.ariaLabel}
              borderRadius="0"
              label={config.label}
              isDisabled={isLoading}
              onClick={() => handleBulkOperation(config.key)}
              icon={<Icon as={config.icon} />}
            />
          ))}
          <SeverityToggle
            value={IssueSeverityLevel.HIGH}
            isDisabled={isLoading}
            onChange={(val) => handleSeverityChange(val)}
            buttonProps={{ px: 2 }}
          />
        </>
      }
    />
  );
};

export default BulkOperations;
