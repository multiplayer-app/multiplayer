import cs from "classnames";

const INTERACTIVE_ROW_CLICK_SELECTOR =
  'button, a, input, textarea, select, [role="button"], [role="combobox"], [contenteditable="true"]';

export const isInteractiveTableRowTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest(INTERACTIVE_ROW_CLICK_SELECTOR);
};

export const getTableRows = (table) => {
  const { rows } = table.getRowModel();
  return rows;
};

export const getIsAllRowsSelected = (table, selectedRows, disabledRows) => {
  const rows = getTableRows(table);
  const checkableRows = rows.filter(
    (row) => !row.original.checkboxHidden && !disabledRows[row.original._id]
  );

  if (!checkableRows.length) {
    return false;
  }

  return checkableRows.every((row) => selectedRows[row.original._id]);
};

export const getIsSomeRowsSelected = (table, selectedRows) => {
  const rows = getTableRows(table);
  return rows.some((row) => selectedRows[row.original._id]);
};

export const getDynamicColumns = (dynamicColumns = {}, columns) => {
  if (Object.keys(dynamicColumns).length) {
    return columns.reduce((acc, num) => {
      const field = dynamicColumns[num.field];

      acc[num.field] = {
        label: num.name,
        visible: field ? field.visible : true,
        ...(field &&
          num.field !== "r-table-actions" && {
            order: field.order,
          }),
      };
      return acc;
    }, {});
  }

  return columns.reduce((acc, num, index) => {
    acc[num.field] = {
      label: num.name,
      visible: true,
      order: index,
    };
    return acc;
  }, {});
};

export const columnHeaderClasses = (
  sortable,
  sorted,
  stickyLeft,
  stickyRight
) =>
  cs({
    "table-header-select-none": !sortable,
    "table-header-sortable": sortable,
    "table-header-sorted": sorted,
    "table-header-sticky-left": stickyLeft !== undefined,
    "table-header-sticky-right": stickyRight !== undefined,
  });

export const cellClasses = (stickyLeft, stickyRight) =>
  cs({
    "table-cell-sticky-left": stickyLeft !== undefined,
    "table-cell-sticky-right": stickyRight !== undefined,
  });

export const HeaderCellRenderer = (component, props) => {
  const { field, width, sortable, expandable } = props.header.column.columnDef;

  return component({
    name: field,
    width,
    sortable,
    expandable,
  });
};
