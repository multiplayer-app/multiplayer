import React, { Fragment, memo } from "react";
import { Spinner, Td, Tr, Tbody } from "@chakra-ui/react";
import TableCellRenderer from "./TableCellRenderer";
import { isInteractiveTableRowTarget } from "./table.helpers";

interface TableBodyRowsProps {
  data: any[];
  columns: any[];
  highlightedRow?: string;
  onRowClick?: (row: any, e: any) => void;
  selectRowOnClick?: boolean;
  onRowDoubleClick?: (row: any, e: any) => void;
  rowClassList: (row: any) => string;
  expandableField?: string;
  expandingBtnDirection?: number;
  noCellPadding?: boolean;
  disabledRows: Record<string, boolean>;
  selectedRows: Record<string, boolean>;
  handleCheckboxChange: (index: number, e: any) => void;
  handleToggleExpand: (rowId: string) => void;
  expandedRows: Record<string, boolean>;
  expandedRow?: (row: any) => React.ReactNode;
  useRowSelection?: boolean;
  useInfiniteScrolling?: boolean;
  loading?: boolean;
}

const TableBodyRows = memo(
  ({
    data,
    columns,
    highlightedRow,
    onRowClick,
    selectRowOnClick,
    onRowDoubleClick,
    rowClassList,
    expandableField,
    expandingBtnDirection,
    noCellPadding,
    disabledRows,
    selectedRows,
    handleCheckboxChange,
    handleToggleExpand,
    expandedRows,
    expandedRow,
    useRowSelection,
    useInfiniteScrolling,
    loading,
  }: TableBodyRowsProps) => {
    const isRowExpandable = !!(expandableField && expandedRow);

    return (
      <Tbody className="table-body">
        {data.map((row, index) => {
          const rowId = row._id || row.id;
          const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
            if (selectRowOnClick) {
              handleCheckboxChange(index, e);
              return;
            }
            if (onRowClick) {
              onRowClick(row, e);
              return;
            }
            if (
              isRowExpandable &&
              rowId &&
              !isInteractiveTableRowTarget(e.target)
            ) {
              handleToggleExpand(rowId);
            }
          };

          return (
            <Fragment key={rowId || index}>
              <Tr
                role="group"
                cursor={
                  selectRowOnClick || onRowClick || isRowExpandable
                    ? "pointer"
                    : undefined
                }
                onClick={
                  selectRowOnClick || onRowClick || isRowExpandable
                    ? handleRowClick
                    : undefined
                }
                {...(onRowDoubleClick && {
                  onDoubleClick: (e) => onRowDoubleClick(row, e),
                })}
                backgroundColor={
                  rowId && highlightedRow === rowId
                    ? "bg.surface"
                    : "bg.primary"
                }
                _hover={{ backgroundColor: "bg.surface" }}
                className={rowClassList(row)}
              >
                {columns.map((col) => {
                  const isExpanded = expandedRows[rowId] || false;

                  return (
                    <Td
                      key={col.id}
                      w={col.width}
                      minW={col.minWidth}
                      maxW={col.maxWidth}
                      left={col.stickyLeft}
                      right={col.stickyRight}
                      paddingX={noCellPadding ? "0" : "3"}
                      backgroundColor="inherit"
                      borderBottomColor="border.primary"
                    >
                      <TableCellRenderer
                        col={col}
                        row={row}
                        index={index}
                        useRowSelection={useRowSelection}
                        expandableField={expandableField}
                        expandingBtnDirection={expandingBtnDirection}
                        noCellPadding={noCellPadding}
                        isDisabled={!!disabledRows[rowId]}
                        isChecked={!!selectedRows[index]}
                        onCheckboxChange={handleCheckboxChange}
                        isExpanded={isExpanded}
                        onToggleExpand={() => handleToggleExpand(rowId)}
                      />
                    </Td>
                  );
                })}
              </Tr>
              {expandedRow && expandedRows[rowId] ? (
                <Tr backgroundColor="bg.surface">
                  <Td backgroundColor="bg.surface" colSpan={columns.length}>
                    {expandedRow(row)}
                  </Td>
                </Tr>
              ) : null}
              {useInfiniteScrolling && index === data.length - 1 && loading ? (
                <Tr backgroundColor="bg.surface">
                  <Td
                    py="1"
                    textAlign="center"
                    backgroundColor="bg.surface"
                    colSpan={columns.length}
                  >
                    <Spinner />
                  </Td>
                </Tr>
              ) : null}
            </Fragment>
          );
        })}
      </Tbody>
    );
  }
);

export default TableBodyRows;
