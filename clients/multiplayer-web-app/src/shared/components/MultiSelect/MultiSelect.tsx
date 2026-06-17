import { useRef, MouseEvent, ChangeEvent, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuItem,
  MenuList,
  MenuListProps,
  PlacementWithLogical,
  Tag,
  TagCloseButton,
  TagLabel,
  useDisclosure,
  useOutsideClick,
} from "@chakra-ui/react";

import { ChevronDownIcon } from "shared/icons";
import { SearchIcon } from "shared/icons";

type Option = {
  label: string;
  value: string;
  disabled?: boolean;
};

interface IMultiSelectProps {
  options: Option[];
  selection: Option[];
  placeholder: string;
  setSelection: (newSelection: Option[]) => void;
  searchable?: boolean;
  placement?: PlacementWithLogical;
  menuListProps?: MenuListProps;
}

const selectedTokens = (
  selection: Option[],
  removeFn: (e: MouseEvent<HTMLButtonElement>, item: Option) => void
) => {
  return (
    <Flex flexWrap="wrap">
      {selection.slice(0, 3).map((item) => {
        return (
          <Tag
            size="sm"
            key={item.value}
            borderRadius="full"
            variant="solid"
            mt="0.5"
            mr="1"
            maxW="72"
            whiteSpace="normal"
          >
            <TagLabel>{item.label}</TagLabel>
            <TagCloseButton as="span" onClick={(e) => removeFn(e, item)} />
          </Tag>
        );
      })}
      {selection.length > 3 && (
        <Tag
          mr="1"
          mt="0.5"
          size="sm"
          maxW="72"
          variant="solid"
          borderRadius="full"
          whiteSpace="normal"
        >
          <TagLabel>{`+ ${selection.length - 3} more`}</TagLabel>
        </Tag>
      )}
    </Flex>
  );
};

const MultiSelect = ({
  options,
  searchable,
  selection,
  setSelection,
  placeholder,
  placement,
  menuListProps,
}: IMultiSelectProps) => {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const [data, setData] = useState(options);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const ref = useRef();
  const timeId = useRef<NodeJS.Timeout>();

  useOutsideClick({
    ref: ref,
    handler: () => onClose(),
  });

  const onChange = (entries: string[]): void => {
    if (isOpen) {
      setSelection(data.filter((entry) => entries.includes(entry.value)));
      setSelectAllChecked(entries.length === data.length);
    }
  };

  const onSelectAll = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.checked) {
      setSelection(data);
      setSelectAllChecked(true);
    } else {
      setSelection(data.filter((entry) => !!entry.disabled));
      setSelectAllChecked(false);
    }
  };

  const onRemove = (e: MouseEvent<HTMLButtonElement>, target: Option) => {
    e.stopPropagation();
    setSelection(selection.filter((entry) => entry.value !== target.value));
  };

  const onSearch = (e) => {
    clearTimeout(timeId.current);
    timeId.current = setTimeout(() => {
      setData(
        options.filter((opt) =>
          opt.label.toLowerCase().includes(e.target.value.trim().toLowerCase())
        )
      );
    }, 300);
  };

  return (
    <div ref={ref}>
      <Menu
        placement={placement || "bottom-start"}
        computePositionOnMount={false}
        isOpen={isOpen}
      >
        <Flex
          as={Button}
          textAlign="left"
          px="4"
          py="2.5"
          height="auto"
          justifyContent="space-between"
          width="100%"
          variant="light"
          boxShadow="none"
          fontWeight="normal"
          color="muted"
          onClick={onToggle}
          rightIcon={<ChevronDownIcon />}
        >
          {selection.length ? selectedTokens(selection, onRemove) : placeholder}
        </Flex>
        <MenuList
          width="22rem"
          rootProps={{ top: "calc(100% + 10px) !important" }}
          {...menuListProps}
        >
          {searchable && (
            <>
              <InputGroup border="none">
                <InputLeftElement
                  pointerEvents="none"
                  children={<Icon as={SearchIcon} color="muted" />}
                />
                <Input
                  type="search"
                  border="none"
                  placeholder="Search"
                  focusBorderColor="none"
                  boxShadow="none"
                  pr="6px"
                  onChange={onSearch}
                  _focus={{
                    boxShadow: "none",
                  }}
                />
              </InputGroup>
              <Divider
                borderColor="border.primary"
                opacity="1"
                width="unset"
                mx="-2"
                mb="2px"
              />
            </>
          )}

          <CheckboxGroup
            onChange={onChange}
            value={selection.map((i) => i.value)}
          >
            <Box
              maxHeight="200px"
              overflowY={data.length > 6 ? "scroll" : "auto"}
              overflowX="hidden"
            >
              {data.length ? (
                <>
                  <MenuItem cursor="pointer" as="label" closeOnSelect={false}>
                    <Box flex="1">Select All</Box>
                    <Checkbox
                      onChange={onSelectAll}
                      isChecked={selectAllChecked}
                    />
                  </MenuItem>
                  {data.map((entry) => {
                    return (
                      <MenuItem
                        cursor="pointer"
                        as="label"
                        key={entry.value}
                        disabled={entry.disabled}
                        closeOnSelect={false}
                      >
                        <Box flex="1">{entry.label}</Box>
                        <Checkbox
                          value={entry.value}
                          disabled={entry.disabled}
                        />
                      </MenuItem>
                    );
                  })}
                </>
              ) : (
                <MenuItem cursor="pointer" as="label" closeOnSelect={false}>
                  <Box flex="1">No results</Box>
                </MenuItem>
              )}
            </Box>
          </CheckboxGroup>
        </MenuList>
      </Menu>
    </div>
  );
};

export default MultiSelect;
