import { useState } from "react";

export function useShiftMultiRowSelection(table: any, setSelectedRows: any) {
  const [lastSelectedRowId, setLastSelectedRowId] = useState(null);

  return (row: any, event: any) => {
    const rowId = row.id; // will be the index here
    const allRows = table.getRowModel().rows;
    const selectedRowIds = { ...table.getState().rowSelection };
    const isCurrentlySelected = !!selectedRowIds[rowId];

    const shiftKey = event?.nativeEvent?.shiftKey;

    if (shiftKey && lastSelectedRowId !== null) {
      // Index positions of last selected and current row
      const lastIndex = allRows.findIndex((r) => r.id === lastSelectedRowId);
      const currentIndex = allRows.findIndex((r) => r.id === rowId);

      // Get range between two indices
      const [start, end] = [lastIndex, currentIndex].sort((a, b) => a - b);

      for (let i = start; i <= end; i++) {
        if (isCurrentlySelected) {
          delete selectedRowIds[allRows[i].id]; // unselect
        } else {
          selectedRowIds[allRows[i].id] = true; // select
        }
      }
    } else {
      if (isCurrentlySelected) {
        delete selectedRowIds[rowId];
      } else {
        selectedRowIds[rowId] = true;
      }
    }

    table.setRowSelection(selectedRowIds);
    setLastSelectedRowId(rowId);
    !!setSelectedRows && setSelectedRows(selectedRowIds);
  };
}