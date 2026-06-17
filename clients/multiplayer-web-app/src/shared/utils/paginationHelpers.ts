/**
 * Calculates the new skip value after deletion to handle pagination correctly.
 *
 * @param options - Pagination options
 * @param options.isAllSelected - Whether all items are selected for deletion
 * @param options.currentTotal - Current total number of items before deletion
 * @param options.deletedCount - Number of items being deleted
 * @param options.currentSkip - Current skip value
 * @param options.pageSize - Page size (limit)
 * @returns New skip value to use after deletion
 */
export function calculateSkipAfterDeletion({
  isAllSelected,
  currentTotal,
  deletedCount,
  currentSkip,
  pageSize,
}: {
  isAllSelected: boolean;
  currentTotal: number;
  deletedCount: number;
  currentSkip: number;
  pageSize: number;
}): number {
  if (isAllSelected) {
    // Reset to first page when deleting all
    return 0;
  }

  // Calculate new total after deletion
  const newTotal = currentTotal - deletedCount;

  // If current skip is past the new total (we're on last page and deleted all items),
  // go back one page
  return currentSkip >= newTotal
    ? Math.max(0, currentSkip - pageSize)
    : currentSkip;
}
