import { memo, useCallback, useEffect, useMemo, useState } from "react";
import cs from "classnames";
import { Flex, Image, Table as ChakraTable, Text } from "@chakra-ui/react";
import { SortingDirection } from "shared/models/enums";
import PageLoading from "shared/components/PageLoading";
import NextPageTrigger from "shared/components/NextPageTrigger";
import EmptyTable from "assets/images/emptyStates/table-empty.png";
import { ITableSorting } from "shared/models/interfaces";
import TableHeader from "./TableHeader";
import TableBodyRows from "./TableBodyRows";
import TableListView from "./TableListView";
import TablePagination from "./TablePagination";
import { useVisibility } from "../Visibility";
import "./Table.scss";

interface TableColumn {
  field: string;
  name: string;
  sortable?: boolean;
  component?: (row: any) => React.ReactNode;
  id?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
}
interface TableSimpleProps {
  data: any[];
  highlightedRow?: string;
  columns: TableColumn[];
  sorting?: ITableSorting;
  onSortingChange?: (sorting: ITableSorting | null) => void;
  onRowClick?: (row: any, e: React.MouseEvent<HTMLTableRowElement>) => void;
  onRowSelect?: (row: any) => void;
  onRowDoubleClick?: (
    row: any,
    e: React.MouseEvent<HTMLTableRowElement>
  ) => void;
  onAllRowsSelect?: (isSelected: boolean) => void;
  selectedRows?: { [rowId: string]: boolean };
  setSelectedRows?: any;
  disabledRows?: { [rowId: string]: boolean };
  tableWrapperHeight?: string;
  stickyHeaderTop?: string;
  tableWrapperOverflow?: any;
  useRowSelection?: boolean;
  noDataText?: string;
  loading?: boolean;
  showNoData?: boolean;
  showHeaders?: boolean;
  noCellPadding?: boolean;
  rowClasses?: (row: any) => string;
  pageParams?: { skip: number; limit: number };
  onScrollEnd?: () => void;
  usePagination?: boolean;
  useInfiniteScrolling?: boolean;
  totalItemsCount?: number;
  onPageChange?: (skip: number) => void;
  onPageSizeChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  hideTableOnEmptyData?: boolean;
  expandableField?: string;
  expandedRow?: (row: any) => React.ReactNode;
  expandingBtnDirection?: number;
  defaultMinWidth?: number;
  selectRowOnClick?: boolean;
  tableName?: string;
  mobileBreakpoint?: string;
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
}

const TableSimple = memo(
  ({
    columns = [],
    data,
    loading,
    highlightedRow,
    selectedRows = {},
    setSelectedRows,
    disabledRows = {},
    sorting,
    rowClasses,
    pageParams,
    totalItemsCount,
    useRowSelection,
    expandedRow,
    expandableField,
    tableWrapperHeight,
    tableWrapperOverflow = "auto",
    expandingBtnDirection = 1,
    stickyHeaderTop = "0",
    onRowClick,
    onAllRowsSelect,
    onRowDoubleClick,
    onSortingChange,
    onScrollEnd,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions,
    noDataText = "No Data",

    showNoData = true,
    showHeaders = true,
    noCellPadding = false,
    selectRowOnClick = false,
    usePagination = false,
    useInfiniteScrolling = false,
    hideTableOnEmptyData = false,
    defaultMinWidth = 130,
    tableName = "table",
    mobileBreakpoint = "md",
    renderListItem,
  }: TableSimpleProps) => {
    const [lastSelectedRowIndex, setLastSelectedRowIndex] = useState<
      number | null
    >(null);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>(
      {}
    );

    const breakpointVisibility = useMemo(
      () => ({ base: false, [mobileBreakpoint]: true } as const),
      [mobileBreakpoint]
    );
    const isBreakpointVisible = useVisibility(breakpointVisibility);
    const isTableLayout = !renderListItem ? true : isBreakpointVisible;

    const columnsWithResize = useMemo(() => {
      const columnsList = [
        ...(useRowSelection
          ? [
              {
                id: "select",
                field: "select",
                name: "Select",
                width: "40px",
                minWidth: "40px",
                maxWidth: "40px",
              },
            ]
          : []),
        ...columns,
      ];

      return columnsList.map((col, index) => {
        const baseId = col.id ?? col.field ?? `col_${index}`;
        const stableId = `${baseId}_${index}`;
        return { ...col, id: stableId };
      });
    }, [columns, useRowSelection, tableName]);

    useEffect(() => {
      localStorage.removeItem(`${tableName}Sizes`);
    }, [tableName]);

    const onSort = useCallback(
      (field: string) => {
        if (!onSortingChange) return;

        if (!sorting || sorting.key !== field) {
          onSortingChange({ key: field, direction: SortingDirection.ASC });
          return;
        }

        if (sorting.direction === SortingDirection.ASC) {
          onSortingChange({ key: field, direction: SortingDirection.DESC });
          return;
        }

        if (sorting.direction === SortingDirection.DESC) {
          onSortingChange(null);
        }
      },
      [sorting, onSortingChange]
    );

    const handleCheckboxChange = useCallback(
      (rowIndex: number, event: any) => {
        const shiftKey = event?.nativeEvent?.shiftKey;
        const isCurrentlySelected = !!selectedRows[rowIndex];
        const newSelection: Record<string, boolean> = { ...selectedRows };

        if (shiftKey && lastSelectedRowIndex !== null) {
          const [start, end] = [lastSelectedRowIndex, rowIndex].sort(
            (a, b) => a - b
          );

          for (let i = start; i <= end; i++) {
            if (isCurrentlySelected) {
              delete newSelection[i];
            } else {
              newSelection[i] = true;
            }
          }
        } else {
          if (isCurrentlySelected) {
            delete newSelection[rowIndex];
          } else {
            newSelection[rowIndex] = true;
          }
        }
        setSelectedRows && setSelectedRows(newSelection);
        setLastSelectedRowIndex(rowIndex);
      },
      [selectedRows, lastSelectedRowIndex, setSelectedRows]
    );

    const handleSelectAll = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const newSelection = isChecked
          ? Object.fromEntries(data.map((_, index) => [index, true]))
          : {};
        setSelectedRows && setSelectedRows(newSelection);
        onAllRowsSelect && onAllRowsSelect(isChecked);
      },
      [data, setSelectedRows, onAllRowsSelect]
    );

    const rowClassList = useCallback(
      (row: any) => cs(rowClasses ? rowClasses(row) : ""),
      [rowClasses]
    );

    const handleToggleExpand = useCallback((rowId: string) => {
      setExpandedRows((prev) => ({
        ...prev,
        [rowId]: !prev[rowId],
      }));
    }, []);

    const hasData = !!(data && data.length);

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
          overflowX="auto"
          direction="column"
          h={tableWrapperHeight || "100%"}
        >
          {!(hideTableOnEmptyData && !hasData) &&
            (isTableLayout ? (
              <ChakraTable w="full" layout={"auto"}>
                <TableHeader
                  columns={columnsWithResize}
                  sorting={sorting}
                  dataLength={data.length}
                  showHeaders={showHeaders}
                  selectedRows={selectedRows}
                  stickyHeaderTop={stickyHeaderTop}
                  onSort={onSort}
                  handleSelectAll={handleSelectAll}
                  useRowSelection={useRowSelection}
                />
                {hasData ? (
                  <TableBodyRows
                    data={data}
                    loading={loading}
                    columns={columnsWithResize}
                    highlightedRow={highlightedRow}
                    noCellPadding={noCellPadding}
                    disabledRows={disabledRows}
                    selectedRows={selectedRows}
                    expandedRows={expandedRows}
                    expandableField={expandableField}
                    useRowSelection={useRowSelection}
                    selectRowOnClick={selectRowOnClick}
                    useInfiniteScrolling={useInfiniteScrolling}
                    expandingBtnDirection={expandingBtnDirection}
                    onRowClick={onRowClick}
                    expandedRow={expandedRow}
                    rowClassList={rowClassList}
                    onRowDoubleClick={onRowDoubleClick}
                    handleToggleExpand={handleToggleExpand}
                    handleCheckboxChange={handleCheckboxChange}
                  />
                ) : null}
              </ChakraTable>
            ) : renderListItem ? (
              <TableListView
                data={data}
                columnsWithResize={columnsWithResize}
                expandedRows={expandedRows}
                disabledRows={disabledRows}
                selectedRows={selectedRows}
                noCellPadding={noCellPadding}
                highlightedRow={highlightedRow}
                expandableField={expandableField}
                useRowSelection={useRowSelection}
                selectRowOnClick={selectRowOnClick}
                expandingBtnDirection={expandingBtnDirection}
                onRowClick={onRowClick}
                expandedRow={expandedRow}
                rowClassList={rowClassList}
                renderListItem={renderListItem}
                onRowDoubleClick={onRowDoubleClick}
                handleToggleExpand={handleToggleExpand}
                handleCheckboxChange={handleCheckboxChange}
              />
            ) : null)}
          {!hasData && !loading && showNoData ? (
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
              <Image w="120px" src={EmptyTable} />
              <Text fontWeight="500">{noDataText}</Text>
            </Flex>
          ) : null}
          {!hasData && loading ? (
            <Flex py="12">
              <PageLoading />
            </Flex>
          ) : null}
          {useInfiniteScrolling && (
            <NextPageTrigger onIntersect={onScrollEnd} />
          )}
        </Flex>
        {usePagination &&
          pageParams &&
          onPageChange &&
          totalItemsCount !== undefined && (
            <TablePagination
              totalItemsCount={totalItemsCount}
              pageParams={pageParams}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              pageSizeOptions={pageSizeOptions}
            />
          )}
        {useInfiniteScrolling && !!data?.length && totalItemsCount != null && (
          <Flex justifyContent="space-between" alignItems="center" py={3}>
            <Text textAlign="center" color="muted" fontWeight="500">
              Total: {totalItemsCount} item{totalItemsCount === 1 ? "" : "s"}
            </Text>
          </Flex>
        )}
      </Flex>
    );
  }
);

export default TableSimple;
