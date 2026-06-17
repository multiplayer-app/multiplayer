import { ChevronDownIcon } from "shared/icons";
import {
  Menu,
  Icon,
  Button,
  MenuItem,
  MenuList,
  MenuButton,
} from "@chakra-ui/react";

interface VersionHistoryFilterProps {
  value: string;
  onChange: (v: string) => void;
}
const items = {
  all: { label: "All versions" },
  named: { label: "Named versions" },
};
const VersionHistoryFilter = ({
  value,
  onChange,
}: VersionHistoryFilterProps) => {
  return (
    <Menu matchWidth>
      <MenuButton
        w="full"
        as={Button}
        variant="light"
        textAlign="left"
        justifyContent="space-between"
        rightIcon={<Icon as={ChevronDownIcon} />}
      >
        {items[value].label}
      </MenuButton>
      <MenuList>
        {Object.keys(items).map((key) => (
          <MenuItem key={key} onClick={() => onChange(key)}>
            {items[key].label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default VersionHistoryFilter;
