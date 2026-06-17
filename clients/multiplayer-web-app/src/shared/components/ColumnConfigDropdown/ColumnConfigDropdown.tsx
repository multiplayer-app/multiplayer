import { memo } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  Flex,
  Text,
  IconButton,
  MenuGroup,
  Portal,
} from "@chakra-ui/react";
import Icon from "../Icon";

interface ColumnConfigDropdownProps {
  columns: Array<{
    field: string;
    name: string;
  }>;
  config: Record<string, boolean>;
  onChange: (field: string, visible: boolean) => void;
}

const ColumnConfigDropdown = memo(
  ({ columns, config, onChange }: ColumnConfigDropdownProps) => {
    return (
      <Menu isLazy>
        <MenuButton
          as={IconButton}
          variant="light"
          aria-label="Configure columns"
          icon={<Icon name="Columns3Cog" />}
        />
        <Portal>
          <MenuList zIndex="popover" minW="200px" maxH="300px" overflowY="auto">
            {/* <MenuItem as="label" closeOnSelect={false}>
            Resizable
            <Switch
              ml="auto"
              colorScheme="brand"
              isChecked={config.__resizable}
              onChange={(e) => {
                onChange("__resizable", e.target.checked);
              }}
            />
          </MenuItem>
          <MenuDivider /> */}
            <MenuGroup
              title="Columns visibility"
              m="2"
              fontSize="sm"
              fontWeight="500"
              color="muted"
            />
            {columns.map((column) => {
              const isVisible = config[column.field] !== false;
              return (
                <MenuItem
                  key={column.field}
                  as="label"
                  cursor="pointer"
                  closeOnSelect={false}
                  _hover={{ bg: "bg.surface" }}
                >
                  <Flex
                    alignItems="center"
                    w="full"
                    justifyContent="space-between"
                  >
                    <Text fontSize="sm" fontWeight="500" color="subtle">
                      {column.name}
                    </Text>
                    <Checkbox
                      isChecked={isVisible}
                      onChange={(e) => {
                        onChange(column.field, e.target.checked);
                      }}
                      colorScheme="brand"
                    />
                  </Flex>
                </MenuItem>
              );
            })}
          </MenuList>
        </Portal>
      </Menu>
    );
  }
);

ColumnConfigDropdown.displayName = "ColumnConfigDropdown";

export default ColumnConfigDropdown;
