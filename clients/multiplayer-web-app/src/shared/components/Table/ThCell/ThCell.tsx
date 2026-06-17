import { TableColumnHeaderProps, Th, Flex, Box, Icon } from "@chakra-ui/react";
import { ReactNode } from "react";
import {
  ChevronUpFilled,
  ChevronDownFilled,
  ChevronUpAndDownFilled,
} from "shared/icons";
import { SortingDirection } from "shared/models/enums";
import { ITableSorting } from "shared/models/interfaces";

interface ThCellProps extends TableColumnHeaderProps {
  sortKey?: string;
  sortable?: boolean;
  sorting?: ITableSorting | null;
  children?: ReactNode | undefined;
  onSortChange?: (
    s: { key: string; direction: SortingDirection } | null
  ) => void;
}

const ThCell = (props: ThCellProps) => {
  const { children, sortable, sorting, onSortChange, sortKey, ...rest } = props;
  const onSort = (key) => {
    if (!sorting || (sorting && sorting.key !== key)) {
      onSortChange({ key, direction: SortingDirection.ASC });
      return;
    }

    if (sorting.direction === SortingDirection.ASC) {
      onSortChange({ key, direction: SortingDirection.DESC });
      return;
    }

    if (sorting.direction === SortingDirection.DESC) {
      onSortChange(null);
    }
  };

  return (
    <Th
      border="none"
      fontSize="sm"
      color="muted"
      fontWeight="500"
      userSelect="none"
      letterSpacing="normal"
      backgroundColor="bg.subtle"
      textTransform="none"
      _first={{
        borderTopLeftRadius: "8px",
        borderBottomLeftRadius: "8px",
      }}
      _last={{
        borderTopRightRadius: "8px",
        borderBottomRightRadius: "8px",
      }}
      onClick={() => onSortChange && onSort(sortKey)}
      {...rest}
    >
      <Flex gap="2" alignItems="center">
        {props.children}
        {sortable && (
          <Box ml="auto">
            {sorting ? (
              sortKey && sorting.key === sortKey ? (
                <>
                  {sorting && sorting.direction === SortingDirection.ASC && (
                    <Icon boxSize="4" as={ChevronUpFilled} />
                  )}
                  {sorting && sorting.direction === SortingDirection.DESC && (
                    <Icon boxSize="4" as={ChevronDownFilled} />
                  )}
                </>
              ) : null
            ) : (
              <Icon
                boxSize="4"
                pointerEvents="none"
                as={ChevronUpAndDownFilled}
              />
            )}
          </Box>
        )}
      </Flex>
    </Th>
  );
};

export default ThCell;
