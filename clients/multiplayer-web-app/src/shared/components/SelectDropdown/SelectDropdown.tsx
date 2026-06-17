import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Box,
  Button,
  Portal,
  MenuListProps,
  ButtonProps,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "shared/icons";
import DebounceSearch from "shared/components/DebounceSearch";

type ValueType = { value: any; label: string; icon?: ReactNode };

interface SelectDropdownProps {
  value: any;
  options: ValueType[];
  onChange: (val: ValueType) => void;
  searchable?: boolean;
  placeholder?: string;
  listProps?: MenuListProps;
  buttonProps?: ButtonProps;
  leftChild?: ReactNode;
}

const SelectDropdown = ({
  value,
  options,
  onChange,
  searchable = false,
  placeholder = "Select",
  listProps = {},
  buttonProps = {},
  leftChild = null,
}: SelectDropdownProps) => {
  const [query, setQuery] = useState("");
  const buttonRef = useRef(null);
  const [dropdownWidth, setDropdownWidth] = useState(230);
  const list = useMemo(
    () =>
      options.filter((i) =>
        i.label.toString().toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value)?.label;
  }, [options, value]);

  useEffect(() => {
    if (buttonRef.current) {
      const width = buttonRef.current.getBoundingClientRect().width;
      setDropdownWidth(width);
    }
  }, []);

  return (
    <Menu>
      <MenuButton
        px={4}
        py={2}
        as={Button}
        variant="light"
        {...buttonProps}
        ref={buttonRef}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Flex flex={1} alignItems="center" gap={1}>
            {leftChild} {selectedOption || placeholder}
          </Flex>{" "}
          <ChevronDownIcon />
        </Flex>
      </MenuButton>
      <Portal>
        <MenuList
          {...listProps}
          maxH={searchable ? "260px" : "245px"}
          overflow="auto"
          zIndex="popover"
          width={dropdownWidth}
        >
          {searchable && (
            <Box
              position="sticky"
              top="-8px"
              bg="bg.primary"
              zIndex="1"
              padding={2}
              margin="-8px"
              mb={0}
            >
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
                  _focus: {
                    border: "none",
                    boxShadow: "none",
                    outline: "none",
                  },
                  placeholder: "Search...",
                  borderRadius: "12px",
                  background: "bg.surface",
                }}
              />
            </Box>
          )}
          {list.map((opt, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                if (opt.value === value) return;
                onChange(opt);
              }}
              gap={1}
            >
              {opt.icon} {opt.label}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default SelectDropdown;
