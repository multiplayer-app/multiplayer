import { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Menu,
  Text,
  Button,
  MenuList,
  MenuItem,
  Checkbox,
  MenuButton,
  CheckboxGroup,
} from "@chakra-ui/react";

import {
  MultipSelectOption,
  IMultiSelectFilterProps,
} from "../../models/interfaces";
import { ChevronDownIcon } from "shared/icons";
import DebounceSearch from "../DebounceSearch";
import { useVisibility } from "../Visibility";

const MultiSelectFilter = ({
  options,
  searchable,
  selection,
  setSelection,
  filterName,
  selectionKey,
  buttonProps,
  menuProps,
  menuPlacement = "bottom-end",
  sortAlphabetically = true,
  selectionMode = "multi",
  capitalizeLabels = true,
}: IMultiSelectFilterProps) => {
  const [query, setQuery] = useState("");
  const isDesktop = useVisibility({ base: false, md: true });

  const onChange = (selectedOptions: (string | number)[]): void => {
    let newSelection;

    if (selectionMode === "single") {
      const lastSelected = selectedOptions[selectedOptions.length - 1];
      newSelection = lastSelected || null;
    } else {
      newSelection = menuOptions.filter((option) =>
        selectedOptions.includes(option.value)
      );
    }

    setSelection(selectionKey, newSelection);
  };

  const menuOptions = useMemo(() => {
    let arr = !query
      ? options
      : options.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase())
        );
    if (sortAlphabetically) {
      arr = arr.sort((a, b) => a.label.localeCompare(b.label));
    }

    return arr;
  }, [options, query]);

  const selectedLabel = useMemo(
    () =>
      selectionMode === "single"
        ? options.find((i) => i.value === selection)?.label
        : (selection?.[0] as MultipSelectOption)?.label,
    [selectionMode, selection, options]
  );

  return (
    <Menu placement={menuPlacement} computePositionOnMount={true}>
      <MenuButton
        as={Button}
        variant="light"
        rightIcon={isDesktop ? <ChevronDownIcon /> : null}
        bg={selection?.length ? "bg.subtle" : "bg.primary"}
        color={selection?.length ? "body" : "muted"}
        {...buttonProps}
      >
        <Flex alignItems="center">
          <Text>
            {filterName}
            {selection?.length > 0 && ": "}
            {selection && selectedLabel}
          </Text>
          {selectionMode === "multi" && selection.length > 1 && (
            <Box bg="muted" borderRadius="xl" px="1.5" py="0.5" ml="1">
              <Text color="subtle" fontSize="xs">
                +{selection?.length - 1}
              </Text>
            </Box>
          )}
        </Flex>
      </MenuButton>
      <MenuList zIndex="5" maxWidth="100px" {...menuProps}>
        {searchable && (
          <DebounceSearch
            onSearch={setQuery}
            inputGroupProps={{
              margin: "0",
              padding: "0",
            }}
            inputProps={{
              p: "8px 8px 8px 36px",
              margin: "0",
              border: "none",
              boxShadow: "none",
              outline: "none",
              _focus: { border: "none", boxShadow: "none", outline: "none" },
              placeholder: "Search...",
              borderRadius: "12px",
              background: "bg.surface",
            }}
          />
        )}

        <Flex
          mr="-1"
          h="100%"
          overflow="auto"
          maxHeight="240px"
          flexDirection="column"
        >
          <CheckboxGroup
            onChange={onChange}
            value={
              selectionMode === "single"
                ? typeof selection === "string" && selection
                  ? [selection]
                  : []
                : (Array.isArray(selection) ? selection : []).map(
                    (i) => i.value
                  )
            }
          >
            {!!menuOptions.length ? (
              menuOptions.map((option) => (
                <MenuItem
                  as={Checkbox}
                  key={option.label}
                  value={String(option.value)}
                  outline="none"
                  _hover={{ bg: "bg.muted" }}
                >
                  <Flex alignItems="center">
                    <Text
                      fontSize="sm"
                      fontWeight="500"
                      color="subtle"
                      textTransform={capitalizeLabels ? "capitalize" : "unset"}
                    >
                      {option.label}
                    </Text>
                  </Flex>
                </MenuItem>
              ))
            ) : (
              <Text pt="1" textAlign="center" color="muted">
                No options
              </Text>
            )}
          </CheckboxGroup>
        </Flex>
      </MenuList>
    </Menu>
  );
};

export default MultiSelectFilter;
