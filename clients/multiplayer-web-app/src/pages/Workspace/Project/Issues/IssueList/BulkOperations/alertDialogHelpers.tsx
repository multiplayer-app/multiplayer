import pluralize from "pluralize";

export interface AlertDialogContent {
  title: string;
  description: React.ReactNode;
}

export const createAlertDialogContent = (
  operation: string,
  selectedItemsCount: number,
  isAllSelected: boolean,
  hasFilters: boolean,
  totalCount: number
): AlertDialogContent => {
  const count =
    isAllSelected && hasFilters ? `all (${totalCount})` : selectedItemsCount;

  return {
    title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} issues`,
    description: (
      <>
        Are you sure you want to {operation} <b>{count}</b>{" "}
        {pluralize("issue", selectedItemsCount)}?
      </>
    ),
  };
};
