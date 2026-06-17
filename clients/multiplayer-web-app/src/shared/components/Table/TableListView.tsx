import React, { memo } from "react";
import { Box, Checkbox, Flex, Text } from "@chakra-ui/react";
import TableCellRenderer from "./TableCellRenderer";
import { isInteractiveTableRowTarget } from "./table.helpers";

interface TableListViewProps {
  data: any[];
  columnsWithResize: any[];
  expandedRows: Record<string, boolean>;
  disabledRows: Record<string, boolean>;
  selectedRows: Record<string, boolean>;
  selectRowOnClick?: boolean;
  onRowClick?: (row: any, e: any) => void;
  onRowDoubleClick?: (row: any, e: any) => void;
  expandableField?: string;
  expandingBtnDirection?: number;
  noCellPadding?: boolean;
  handleCheckboxChange: (index: number, e: any) => void;
  handleToggleExpand: (rowId: string) => void;
  useRowSelection?: boolean;
  expandedRow?: (row: any) => React.ReactNode;
  renderListItem?: (args: {
    row: any;
    index: number;
    columns: any[];
    isSelected: boolean;
    isDisabled: boolean;
    isExpanded: boolean;
    onSelect?: (event: any) => void;
    onToggleExpand?: () => void;
    onRowClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  }) => React.ReactNode;
  highlightedRow?: string;
  rowClassList: (row: any) => string;
}

const TableListView = memo(
  ({
    data,
    columnsWithResize,
    expandedRows,
    disabledRows,
    selectedRows,
    selectRowOnClick,
    onRowClick,
    onRowDoubleClick,
    expandableField,
    expandingBtnDirection,
    noCellPadding,
    handleCheckboxChange,
    handleToggleExpand,
    useRowSelection,
    expandedRow,
    renderListItem,
    highlightedRow,
    rowClassList,
  }: TableListViewProps) => (
    <Flex direction="column" gap="3" py="2">
      {data.map((row, index) => {
        const rowId = row._id || row.id || index;
        const isExpanded = expandedRows[rowId] || false;
        const isDisabled = !!disabledRows[rowId];
        const isSelected = !!selectedRows[index];
        const isRowExpandable = !!(expandableField && expandedRow);
        const rowClickHandler = selectRowOnClick
          ? (e: any) => handleCheckboxChange(index, e)
          : onRowClick
          ? (e: any) => onRowClick(row, e as any)
          : isRowExpandable
          ? (e: any) => {
              if (!isInteractiveTableRowTarget(e.target)) {
                handleToggleExpand(rowId);
              }
            }
          : undefined;
        const rowDoubleClickHandler = onRowDoubleClick
          ? (e: any) => onRowDoubleClick(row, e as any)
          : undefined;

        const defaultListItem = (
          <Flex direction="column" gap="2">
            {useRowSelection ? (
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="muted">
                  Select
                </Text>
                <Checkbox
                  isChecked={isSelected}
                  isDisabled={isDisabled}
                  onChange={(e) => handleCheckboxChange(index, e)}
                />
              </Flex>
            ) : null}
            {columnsWithResize
              .filter((col) => col.field !== "select")
              .map((col) => (
                <Flex key={`${rowId}-${col.id}`} align="flex-start" gap="2">
                  <Text
                    color="muted"
                    fontSize="sm"
                    minW="120px"
                    maxW="180px"
                    flexShrink={0}
                  >
                    {col.name}
                  </Text>
                  <Box flex="1" minW="0">
                    <TableCellRenderer
                      col={col}
                      row={row}
                      index={index}
                      useRowSelection={useRowSelection}
                      expandableField={expandableField}
                      expandingBtnDirection={expandingBtnDirection}
                      noCellPadding={noCellPadding}
                      isDisabled={isDisabled}
                      isChecked={isSelected}
                      onCheckboxChange={handleCheckboxChange}
                      isExpanded={isExpanded}
                      onToggleExpand={() => handleToggleExpand(rowId)}
                    />
                  </Box>
                </Flex>
              ))}
            {expandedRow && isExpanded ? (
              <Box pt="2">{expandedRow(row)}</Box>
            ) : null}
          </Flex>
        );

        const customListItem =
          renderListItem &&
          renderListItem({
            row,
            index,
            columns: columnsWithResize,
            isSelected,
            isDisabled,
            isExpanded,
            onSelect: useRowSelection
              ? (e: any) => handleCheckboxChange(index, e)
              : undefined,
            onToggleExpand: expandableField
              ? () => handleToggleExpand(rowId)
              : undefined,
            onRowClick: selectRowOnClick ? undefined : rowClickHandler,
          });

        return (
          <Box
            key={rowId}
            p="4"
            borderWidth="1px"
            borderColor="border.primary"
            borderRadius="8px"
            backgroundColor={
              highlightedRow === row._id ? "bg.surface" : "bg.primary"
            }
            className={rowClassList(row)}
            cursor={rowClickHandler ? "pointer" : undefined}
            onClick={rowClickHandler}
            onDoubleClick={rowDoubleClickHandler}
          >
            {customListItem ?? defaultListItem}
          </Box>
        );
      })}
    </Flex>
  )
);

export default TableListView;
