import pluralize from "pluralize";
import { ISSUE_HASH_KEY } from "shared/configs/issues.configs";

export const getBulkOperationBody = (
  selectedIds: string[],
  isAllSelected: boolean,
  hasFilters: boolean
) => {
  if (!isAllSelected || hasFilters) {
    return { [ISSUE_HASH_KEY]: selectedIds };
  }
  return {};
};

export const getBulkOperationFilters = (filters: any) => {
  const { title, text, resolved, archived, severity, lastSeen } = filters || {};
  return {
    ...(text && { text }),
    ...(title && { title }),
    ...(resolved !== undefined && { resolved }),
    ...(archived !== undefined && { archived }),
    ...(severity && { severity }),
    ...(lastSeen?.gte && { "lastSeen.gte": lastSeen.gte }),
    ...(lastSeen?.lte && { "lastSeen.lte": lastSeen.lte }),
  };
};

export const getOperationCount = (body: any, issues: any) => {
  const count = body.ids?.length || body[ISSUE_HASH_KEY]?.length;
  return count ? count : issues.cursor.total;
};

export const getSuccessMessage = (count: number, operation: string) => {
  const action = operation === "delete" ? "deleted" : "updated";
  return `${count} ${pluralize("issue", count)} ${action}`;
};
