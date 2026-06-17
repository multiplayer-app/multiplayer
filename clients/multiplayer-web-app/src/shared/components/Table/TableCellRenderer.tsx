import React from "react";
import { Box, Checkbox, Flex, Text } from "@chakra-ui/react";
import CollapseToggleButton from "shared/components/CollapseToggleButton";

interface TableCellRendererProps {
  col: any;
  row: any;
  index: number;
  isChecked?: boolean;
  isDisabled?: boolean;
  isExpanded?: boolean;
  noCellPadding?: boolean;
  useRowSelection?: boolean;
  expandableField?: string;
  expandingBtnDirection?: number;
  onToggleExpand?: () => void;
  onCheckboxChange?: (index: number, e: any) => void;
}

// Stable cell renderer to prevent remounting
const TableCellRenderer = ({
  col,
  row,
  index,
  isChecked,
  isDisabled,
  isExpanded,
  noCellPadding,
  useRowSelection,
  expandableField,
  expandingBtnDirection,
  onToggleExpand,
  onCheckboxChange,
}: TableCellRendererProps) => {
  const rowId = row._id || row.id;
  const value = row[col.field];

  if (useRowSelection && col.field === "select") {
    return (
      <Flex
        key={`checkbox-${rowId}`}
        h="full"
        alignItems="center"
        onClick={(e) => e.stopPropagation()}
        px={noCellPadding ? "3" : "0"}
      >
        <Checkbox
          p="2"
          mx="-2"
          cursor="pointer"
          isChecked={isChecked}
          disabled={isDisabled}
          __css={{ span: { bg: "bg.primary", display: "block" } }}
          onChange={(e) => onCheckboxChange?.(index, e)}
        />
      </Flex>
    );
  }

  // Render expandable content
  if (expandableField === col.field) {
    const cellContent = col.component ? (
      col.component(row)
    ) : value != null && value !== "" ? (
      <Text>{value}</Text>
    ) : null;

    return (
      <Flex
        w="full"
        gap="4px"
        alignItems="center"
        key={`expandable-${rowId}`}
        justifyContent={cellContent ? "space-between" : "flex-end"}
        flexDirection={expandingBtnDirection === 1 ? "row" : "row-reverse"}
      >
        <CollapseToggleButton
          collapsed={!isExpanded}
          onToggle={onToggleExpand}
          flexShrink={0}
          ml={expandingBtnDirection === -1 && cellContent ? "auto" : "0"}
        />
        {cellContent}
      </Flex>
    );
  }

  // Render custom component
  if (col.component) {
    return (
      <Box key={`component-${rowId}-${col.field}`}>{col.component(row)}</Box>
    );
  }

  // Render default value
  return (
    <Text title={value} key={`value-${rowId}-${col.field}`}>
      {value}
    </Text>
  );
};

export default React.memo(TableCellRenderer);
