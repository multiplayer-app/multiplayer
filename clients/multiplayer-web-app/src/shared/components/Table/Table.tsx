import { Fragment, memo, useMemo, useState } from "react";
import cs from "classnames";
import {
  Td,
  Th,
  Tr,
  Box,
  Text,
  Flex,
  Icon,
  Thead,
  Image,
  Tbody,
  HStack,
  Button,
  Spinner,
  Checkbox,
  Table as ChakraTable,
} from "@chakra-ui/react";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  getExpandedRowModel,
} from "@tanstack/react-table";
import {
  getTableRows,
  HeaderCellRenderer,
  columnHeaderClasses,
} from "./table.helpers";
import "./Table.scss";

import {
  ChevronUpFilled,
  ChevronDownFilled,
  ChevronUpAndDownFilled,
} from "shared/icons";
import { SortingDirection } from "shared/models/enums";
import PageLoading from "shared/components/PageLoading";
import NextPageTrigger from "shared/components/NextPageTrigger";
import CollapseToggleButton from "shared/components/CollapseToggleButton";
import useTableColumnResize from "shared/hooks/useTableColumnResize";

import EmptyTable from "assets/images/emptyStates/table-empty.png";
import { ITableSorting } from "shared/models/interfaces";
import { useShiftMultiRowSelection } from "./useShiftMultiRowSelection";

const columnHelper = createColumnHelper<any>();
interface TableProps {
  columns: any[];
  data: any[];
  sorting?: ITableSorting;
  setSorting?: (sorting: ITableSorting) => void;
  onRowClick?: (row: any, e: React.MouseEvent<HTMLTableRowElement>) => void;
  onRowSelect?: (row: any) => void;
  onRowDoubleClick?: (
    row: any,
    e: React.MouseEvent<HTMLTableRowElement>
  ) => void;
  onAllRowsSelect?: (rows: any) => void;
  selectedRows?: { [rowId: string]: boolean };
  setSelectedRows?: any;
  disabledRows?: { [rowId: string]: boolean };
  tableWrapperHeight?: string;
  tableWrapperOverflow?: string;
  useRowSelection?: boolean;
  noDataText?: string;
  loading?: boolean;
  resizable?: boolean;
  showNoData?: boolean;
  showHeaders?: boolean;
  noCellPadding?: boolean;
  rowClasses?: (row: any) => string;
  pageParams?: { skip: number; limit: number };
  onScrollEnd?: () => void;
  usePagination?: boolean;
  useInfiniteScrolling?: boolean;
  totalItemsCount?: number;
  setCurrentPage?: any;
  hideTableOnEmptyData?: boolean;
  expandableField?: string;
  expandedRow?: any;
  expandingBtnDirection?: number;
  defaultMinWidth?: number;
  selectRowOnClick?: boolean;
  tableName?: string;
}

const Table = memo(
  ({
    columns = [],
    data,
    loading,
    onRowClick,
    onRowSelect,
    onAllRowsSelect,
    onRowDoubleClick,
    selectedRows = {},
    setSelectedRows,
    disabledRows = {},
    sorting,
    setSorting,
    rowClasses,
    pageParams,
    setCurrentPage,
    totalItemsCount,
    useRowSelection,
    expandedRow,
    expandableField,
    tableWrapperHeight,
    tableWrapperOverflow = "auto",
    expandingBtnDirection = 1,
    onScrollEnd,
    noDataText = "No Data",
    resizable = false,
    showNoData = true,
    showHeaders = true,
    noCellPadding = false,
    usePagination = false,
    selectRowOnClick = false,
    useInfiniteScrolling = false,
    hideTableOnEmptyData = false,
    defaultMinWidth = 130,
    tableName = "table",
  }: TableProps) => {
    const currentPage = useMemo(() => {
      if (pageParams) {
        const { skip, limit } = pageParams;
        return skip / limit + 1;
      }
      return 1;
    }, [pageParams?.skip]);

    const [expanded, setExpanded] = useState({});
    const generatedColumns = useMemo(() => {
      const columnsList = [
        ...(useRowSelection
          ? [
              {
                id: "select",
                field: "select",
                stickyLeft: 0,
                width: 40,
                minWidth: 40,
              },
            ]
          : []),
        ...columns,
      ];

      return columnsList.map((col, index) => ({
        ...col,
        ...columnHelper.accessor(col.field, {
          id: `${col.field}_${index}`,
          header: (props) => {
            if (useRowSelection && col.field === "select") {
              return (
                <Checkbox
                  backgroundColor="bg.primary"
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const newSelection = isChecked
                      ? Object.fromEntries(
                          table.getRowModel().rows.map((row) => [row.id, true])
                        )
                      : {};
                    table.setRowSelection(newSelection);
                    setSelectedRows(newSelection);
                    onAllRowsSelect && onAllRowsSelect(isChecked);
                  }}
                  isChecked={
                    data.length > 0 &&
                    Object.keys(selectedRows).length === data.length
                  }
                  isIndeterminate={
                    Object.keys(selectedRows).length > 0 &&
                    Object.keys(selectedRows).length <
                      table.getRowModel().rows.length
                  }
                />
              );
            }

            if (col.headerComponent) {
              return HeaderCellRenderer(col.headerComponent, props);
            }

            return col.name;
          },
          cell: ({ row, getValue }) => (
            <Flex alignItems="center">
              {useRowSelection && col.field === "select" ? (
                <Flex
                  onClick={(e) => e.stopPropagation()}
                  px={noCellPadding ? "3" : "0"}
                >
                  <Checkbox
                    m="-2"
                    p="2"
                    isChecked={row.getIsSelected()}
                    onChange={(e) => {
                      handleCheckboxChange(row, e);
                    }}
                    disabled={disabledRows[row.original._id]}
                  />
                </Flex>
              ) : null}
              {expandableField === col.field ? (
                <Flex
                  alignItems="center"
                  w="full"
                  gap="4px"
                  flexDirection={
                    expandingBtnDirection === 1 ? "row" : "row-reverse"
                  }
                >
                  <CollapseToggleButton
                    collapsed={!row.getIsExpanded()}
                    onToggle={() => row.toggleExpanded()}
                    ml={expandingBtnDirection === -1 ? "auto" : "0"}
                  />
                  {col.component ? col.component(row.original) : getValue()}
                </Flex>
              ) : col.component ? (
                col.component(row.original)
              ) : (
                getValue()
              )}
            </Flex>
          ),
        }),
      }));
    }, [
      columns,
      useRowSelection,
      onAllRowsSelect,
      onRowSelect,
      selectedRows,
      disabledRows,
      data.length,
    ]);

    const { onPointerDown, headerRef } = useTableColumnResize({
      tableName,
      defaultMinWidth,
      columns: generatedColumns,
    });

    const columnSizing = useMemo(() => {
      let cachedSizes: Record<string, number> = {};

      try {
        const raw = localStorage.getItem(`${tableName}Sizes`);
        if (raw) cachedSizes = JSON.parse(raw);
      } catch {
        // ignore malformed cache
      }

      return Object.fromEntries(
        generatedColumns
          .map((c) => {
            const cachedSize = cachedSizes[`th_${c.id}`];
            const fallbackSize = Math.max(c.width ?? 0, c.minWidth ?? 0);
            const size = cachedSize ?? fallbackSize;
            return size ? [c.id, size] : null;
          })
          .filter(Boolean)
      );
    }, [tableName, generatedColumns]);

    const table = useReactTable({
      data,
      columns: generatedColumns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      columnResizeMode: "onChange",
      onExpandedChange: setExpanded,
      getSubRows: (row) => row.subContent,
      getExpandedRowModel: getExpandedRowModel(),
      onRowSelectionChange: setSelectedRows,
      state: {
        expanded,
        rowSelection: selectedRows,
      },
    });

    const handleCheckboxChange = useShiftMultiRowSelection(
      table,
      setSelectedRows
    );

    const onSort = (field) => {
      if (!sorting || (sorting && sorting.key !== field)) {
        setSorting({ key: field, direction: SortingDirection.ASC });
        return;
      }

      if (sorting.direction === SortingDirection.ASC) {
        setSorting({ key: field, direction: SortingDirection.DESC });
        return;
      }

      if (sorting.direction === SortingDirection.DESC) {
        setSorting(null);
      }
    };

    const rows = getTableRows(table);

    const rowClassList = (row: any) => cs(rowClasses ? rowClasses(row) : "");

    const pageSize = 10;
    const pagesCount = Math.ceil(totalItemsCount / pageSize);

    const handlePageChange = (page: number) => {
      const skipValue = (page - 1) * pageParams?.limit;
      setCurrentPage(skipValue);
    };

    const renderPageNumbers = () => {
      const pageNumbers: (number | string)[] = [];

      if (pagesCount <= 6) {
        // Show all pages if total pages are 5 or fewer
        for (let i = 1; i <= pagesCount; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Show first 5 pages, then ellipsis, and the last page
        if (currentPage <= 3) {
          pageNumbers.push(1, 2, 3, 4, 5, "...", pagesCount);
        } else if (currentPage > pagesCount - 3) {
          pageNumbers.push(
            1,
            "...",
            pagesCount - 4,
            pagesCount - 3,
            pagesCount - 2,
            pagesCount - 1,
            pagesCount
          );
        } else {
          pageNumbers.push(
            1,
            "...",
            currentPage - 1,
            currentPage,
            currentPage + 1,
            "...",
            pagesCount
          );
        }
      }
      return pageNumbers;
    };

    return (
      <Flex
        w="100%"
        flex="1"
        bg="bg.primary"
        minHeight="0"
        direction="column"
        position="relative"
        className="table-wrapper"
        h={tableWrapperHeight || "100%"}
        maxH={tableWrapperHeight || "100%"}
      >
        <Flex
          w="full"
          flex="1"
          overflow={tableWrapperOverflow}
          direction="column"
          h={tableWrapperHeight || "100%"}
        >
          {!(hideTableOnEmptyData && !rows?.length) && (
            <ChakraTable w="full" layout={resizable ? "fixed" : "auto"}>
              {showHeaders && (
                <Thead
                  top="0"
                  zIndex="4"
                  position="sticky"
                  className="table-header"
                >
                  {table.getHeaderGroups().map((headerGroup: any) => (
                    <Tr key={headerGroup.id} border="none" ref={headerRef}>
                      {headerGroup.headers.map((header, index) => {
                        const {
                          width,
                          minWidth,
                          sortable,
                          stickyLeft,
                          stickyRight,
                          field,
                          sortKey,
                        } = header.column.columnDef;
                        let size = columnSizing[header.id];

                        if (size && +size) {
                          size = `${size}px`;
                        }

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
                            key={header.id}
                            id={`th_${header.id}`}
                            backgroundColor="bg.subtle"
                            color="muted"
                            fontSize="sm"
                            fontWeight="500"
                            letterSpacing="normal"
                            textTransform="none"
                            colSpan={header.colSpan}
                            className={columnHeaderClasses(
                              sortable,
                              sorting &&
                                ((field && sorting.key === field) ||
                                  (sortKey && sorting.key === sortKey)),
                              stickyLeft,
                              stickyRight
                            )}
                            style={
                              resizable
                                ? {
                                    width: size || "auto",
                                  }
                                : width && {
                                    width,
                                    minWidth: width,
                                    maxWidth: width,
                                    left: stickyLeft,
                                    right: stickyRight,
                                  }
                            }
                            {...(sortable && {
                              onClick: (e) => {
                                onSort(sortKey || field);
                              },
                            })}
                          >
                            {header.isPlaceholder ? null : (
                              <Flex
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {sortable &&
                                sorting &&
                                ((field && sorting.key === field) ||
                                  (sortKey && sorting.key === sortKey)) ? (
                                  <>
                                    {sorting &&
                                      sorting.direction ===
                                        SortingDirection.ASC && (
                                        <Icon
                                          boxSize="4"
                                          as={ChevronUpFilled}
                                        />
                                      )}
                                    {sorting &&
                                      sorting.direction ===
                                        SortingDirection.DESC && (
                                        <Icon
                                          boxSize="4"
                                          as={ChevronDownFilled}
                                        />
                                      )}
                                  </>
                                ) : null}
                                {sortable && !sorting && (
                                  <Icon
                                    boxSize="4"
                                    pointerEvents="none"
                                    as={ChevronUpAndDownFilled}
                                  />
                                )}
                              </Flex>
                            )}
                            {resizable &&
                              index !== headerGroup.headers.length - 1 && (
                                <Box
                                  as="span"
                                  position="relative"
                                  className="resizer"
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    onPointerDown(e, index);
                                  }}
                                >
                                  <Box
                                    as="span"
                                    inset="0 -3px"
                                    position="absolute"
                                  />
                                </Box>
                              )}
                          </Th>
                        );
                      })}
                    </Tr>
                  ))}
                </Thead>
              )}
              <Tbody className="table-body">
                {rows && rows.length
                  ? rows.map((row, index) => (
                      <Fragment key={row.id}>
                        <Tr
                          role="group"
                          cursor={!!onRowClick ? "pointer" : ""}
                          _hover={{ backgroundColor: "bg.surface" }}
                          {...(onRowClick && {
                            onClick: (e) => onRowClick(row.original, e),
                          })}
                          {...(selectRowOnClick && {
                            onClick: (e) => handleCheckboxChange(row, e),
                          })}
                          {...(onRowDoubleClick && {
                            onDoubleClick: (e) =>
                              onRowDoubleClick(row.original, e),
                          })}
                          backgroundColor={
                            expanded[index] ? "bg.surface" : "bg.primary"
                          }
                          className={rowClassList(row.original)}
                        >
                          {row.getAllCells().map((cell) => {
                            return (
                              <Td
                                key={cell.id}
                                paddingX={noCellPadding ? "0" : "3"}
                                backgroundColor="inherit"
                                borderBottomColor="border.primary"
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </Td>
                            );
                          })}
                        </Tr>
                        {expandableField && row.getIsExpanded() ? (
                          <Tr backgroundColor="bg.surface">
                            <Td
                              backgroundColor="bg.surface"
                              colSpan={row.getAllCells().length}
                            >
                              {expandedRow(row.original)}
                            </Td>
                          </Tr>
                        ) : null}
                        {useInfiniteScrolling &&
                        index === rows.length - 1 &&
                        loading ? (
                          <Tr backgroundColor="bg.surface">
                            <Td
                              py="1"
                              textAlign="center"
                              backgroundColor="bg.surface"
                              colSpan={row.getAllCells().length}
                            >
                              <Spinner />
                            </Td>
                          </Tr>
                        ) : null}
                      </Fragment>
                    ))
                  : null}
              </Tbody>
            </ChakraTable>
          )}
          {!(rows && rows.length) && !loading && showNoData ? (
            <Flex
              py="6"
              gap="4"
              flex="1"
              width="full"
              direction="column"
              alignItems="center"
              justifyContent="center"
              className="table-no-data"
            >
              <Image w="180px" src={EmptyTable} />
              <Text fontWeight="500">{noDataText}</Text>
            </Flex>
          ) : null}
          {!(rows && rows.length) && loading ? (
            <Flex py="12">
              <PageLoading />
            </Flex>
          ) : null}
          {useInfiniteScrolling && (
            <NextPageTrigger onIntersect={onScrollEnd} />
          )}
        </Flex>
        {!!usePagination || (!!useInfiniteScrolling && rows && rows.length) ? (
          <Flex justifyContent="space-between" alignItems="center">
            <Text mt={2} textAlign="center" color="muted" fontWeight="500">
              Total: {totalItemsCount} item{totalItemsCount === 1 ? "" : "s"}
            </Text>
            {usePagination && (
              <>
                <HStack mt={4} spacing={2} justify="center">
                  <Button
                    variant="light"
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {renderPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <Text key={index} px={2}>
                        ...
                      </Text>
                    ) : (
                      <Button
                        key={index}
                        onClick={() => handlePageChange(page as number)}
                        variant={page === currentPage ? "solid" : "outline"}
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="light"
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === pagesCount}
                  >
                    Next
                  </Button>
                </HStack>
                <Box></Box>
              </>
            )}
          </Flex>
        ) : null}
      </Flex>
    );
  }
);
export default Table;
