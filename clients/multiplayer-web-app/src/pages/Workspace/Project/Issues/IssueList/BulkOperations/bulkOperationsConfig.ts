import { ArchiveIcon, CheckCircleIcon, TrashIcon } from "shared/icons";
import { IssueSeverityLevel } from "@multiplayer/types";
import { IIssuesFilters } from "shared/models/interfaces";
import { ArchiveRestore, CircleX } from "lucide-react";

export interface BulkOperationConfig {
  key: string;
  title: string;
  action: string;
  icon: typeof ArchiveIcon;
  ariaLabel: string;
  label: string;
  payload?: {
    resolved?: boolean;
    archived?: boolean;
    severity?: IssueSeverityLevel;
  };
}

const DELETE_CONFIG: BulkOperationConfig = {
  key: "delete",
  title: "Deleting issues",
  action: "delete",
  icon: TrashIcon,
  ariaLabel: "delete",
  label: "Delete selected items",
};

const ARCHIVE_CONFIG: BulkOperationConfig = {
  key: "archive",
  title: "Archiving issues",
  action: "archive",
  icon: ArchiveIcon,
  ariaLabel: "archive",
  label: "Archive selected items",
  payload: { archived: true },
};

const UNARCHIVE_CONFIG: BulkOperationConfig = {
  key: "unarchive",
  title: "Unarchiving issues",
  action: "unarchive",
  icon: ArchiveRestore,
  ariaLabel: "unarchive",
  label: "Unarchive selected items",
  payload: { archived: false },
};

const RESOLVE_CONFIG: BulkOperationConfig = {
  key: "resolve",
  title: "Resolving issues",
  action: "resolve",
  icon: CheckCircleIcon,
  ariaLabel: "resolve",
  label: "Resolve selected items",
  payload: { resolved: true },
};

const UNRESOLVE_CONFIG: BulkOperationConfig = {
  key: "unresolve",
  title: "Unresolving issues",
  action: "unresolve",
  icon: CircleX,
  ariaLabel: "unresolve",
  label: "Unresolve selected items",
  payload: { resolved: false },
};

/**
 * Returns bulk operations config based on current issue filters.
 * - When viewing archived issues: show Unarchive (not Archive)
 * - When viewing resolved issues: show Unresolve (not Resolve)
 */
export const getBulkOperationsConfig = (
  filters: IIssuesFilters
): BulkOperationConfig[] => {
  const configs: BulkOperationConfig[] = [DELETE_CONFIG];

  configs.push(filters?.archived === true ? UNARCHIVE_CONFIG : ARCHIVE_CONFIG);

  configs.push(filters?.resolved === true ? UNRESOLVE_CONFIG : RESOLVE_CONFIG);

  return configs;
};
