import React, { memo } from "react";
import { Checkbox, Flex, Icon, Th, Thead, Tr } from "@chakra-ui/react";
import { ChevronDownFilled, ChevronUpFilled } from "shared/icons";
import { SortingDirection } from "shared/models/enums";
import { columnHeaderClasses, HeaderCellRenderer } from "./table.helpers";

interface TableHeaderProps {
  columns: any[];
  sorting: any;
  dataLength: number;
  showHeaders?: boolean;
  stickyHeaderTop?: string;
  useRowSelection?: boolean;
  selectedRows: Record<string, boolean>;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSort: (field: string) => void;
}

const TableHeader = memo(
  ({
    columns,
    sorting,
    showHeaders,
    dataLength,
    selectedRows,
    stickyHeaderTop,
    useRowSelection,
    handleSelectAll,
    onSort,
  }: TableHeaderProps) => {
    if (!showHeaders) return null;

    return (
      <Thead
        zIndex="4"
        position={{ base: "static", md: "sticky" }}
        top={{ base: "0", md: stickyHeaderTop || "0" }}
        className="table-header"
        whiteSpace="nowrap"
      >
        <Tr border="none">
          {columns.map((col, index) => {
            const {
              width,
              minWidth,
              maxWidth,
              sortable,
              stickyLeft,
              stickyRight,
              field,
              sortKey,
            } = col;

            const isSorted =
              sorting &&
              ((field && sorting.key === field) ||
                (sortKey && sorting.key === sortKey));

            return (
              <Th
                border="none"
                position="relative"
                _first={{
                  borderTopLeftRadius: "8px",
                  borderBottomLeftRadius: "8px",
                }}
                _last={{
                  borderTopRightRadius: "8px",
                  borderBottomRightRadius: "8px",
                }}
                userSelect="none"
                cursor={sortable ? "pointer" : "default"}
                key={col.id}
                id={`th_${col.id}`}
                backgroundColor="bg.subtle"
                color="muted"
                fontSize="sm"
                fontWeight="500"
                letterSpacing="normal"
                textTransform="none"
                className={columnHeaderClasses(
                  sortable,
                  isSorted,
                  stickyLeft,
                  stickyRight
                )}
                w={width}
                minW={minWidth}
                maxW={maxWidth}
                left={stickyLeft}
                right={stickyRight}
                {...(sortable && {
                  onClick: () => {
                    onSort(sortKey || field);
                  },
                })}
              >
                <Flex alignItems="center" justifyContent="space-between">
                  {useRowSelection && col.field === "select" ? (
                    <Checkbox
                      backgroundColor="bg.primary"
                      onChange={handleSelectAll}
                      isChecked={
                        dataLength > 0 &&
                        Object.keys(selectedRows).length === dataLength
                      }
                      isIndeterminate={
                        Object.keys(selectedRows).length > 0 &&
                        Object.keys(selectedRows).length < dataLength
                      }
                    />
                  ) : col.headerComponent ? (
                    HeaderCellRenderer(col.headerComponent, {
                      header: { column: { columnDef: col } },
                    })
                  ) : (
                    col.name
                  )}
                  {sortable &&
                    isSorted &&
                    sorting.direction === SortingDirection.ASC && (
                      <Icon boxSize="4" as={ChevronUpFilled} />
                    )}
                  {sortable &&
                    isSorted &&
                    sorting.direction === SortingDirection.DESC && (
                      <Icon boxSize="4" as={ChevronDownFilled} />
                    )}
                </Flex>
              </Th>
            );
          })}
        </Tr>
      </Thead>
    );
  }
);

export default TableHeader;
