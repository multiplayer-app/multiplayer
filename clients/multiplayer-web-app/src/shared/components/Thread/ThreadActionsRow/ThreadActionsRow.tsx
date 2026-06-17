import DebounceSearch from "shared/components/DebounceSearch";
import {
  Flex,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
} from "@chakra-ui/react";
import { FilterIcon } from "shared/icons";
import { SortOrder } from "@multiplayer/types";
import { useThreads } from "shared/providers/ThreadsContext";

const sortingOrder = [
  {
    label: "Ascending",
    value: SortOrder.ASC,
  },
  {
    label: "Descending",
    value: SortOrder.DESC,
  },
];

const ThreadActionsRow = () => {
  const { params, setParams } = useThreads();

  const onSearch = (query: string) => {
    if (query) {
      setParams((prevParams) => ({
        ...prevParams,
        search: query,
      }));
    } else {
      setParams(({ search, ...restParams }) => ({ ...restParams }));
    }
  };

  const onSort = (sort: SortOrder) => {
    setParams((prevParams) => ({
      ...prevParams,
      sortOrder: sort,
    }));
  };

  return (
    <Flex alignItems="center" p="4">
      <DebounceSearch
        onSearch={onSearch}
        inputGroupProps={{ mr: 4, my: 0 }}
        inputProps={{
          backgroundColor: "bg.surface",
          _focus: { backgroundColor: "bg.primary" },
        }}
      />
      <Menu>
        <MenuButton borderWidth="0">
          <FilterIcon />
        </MenuButton>
        <MenuList minWidth="240px" zIndex={3}>
          <MenuOptionGroup
            value={params.sortOrder}
            title="Order"
            type="radio"
            ml={2}
          >
            {sortingOrder.map((opt) => (
              <MenuItemOption
                key={opt.value}
                value={opt.value}
                onClick={() => onSort(opt.value)}
              >
                {opt.label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default ThreadActionsRow;
