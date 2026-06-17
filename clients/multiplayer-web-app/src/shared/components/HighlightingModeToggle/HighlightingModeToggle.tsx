import { Icon, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { DocChangesHighlightIcon } from "shared/icons";
import { ChangesViewMode } from "shared/models/enums";
import { ToolbarButton } from "../Toolbar";
import { CheckCircleIcon } from "@chakra-ui/icons";
interface HighlightingModeToggleProps {
  value: ChangesViewMode;
  onChange: (v: ChangesViewMode) => void;
}

const HighlightingModeToggle = ({
  value,
  onChange,
}: HighlightingModeToggleProps) => {
  return (
    <Menu>
      <MenuButton
        zIndex="2"
        as={ToolbarButton}
        justifyContent="center"
        icon={
          <Icon
            as={DocChangesHighlightIcon}
            color={value !== ChangesViewMode.NONE ? "brand.500" : ""}
          />
        }
      />

      <MenuList minW="40">
        {options.map((opt) => (
          <MenuItem key={opt.value} onClick={() => onChange(opt.value)}>
            {opt.label}
            {value === opt.value && (
              <Icon
                ml="auto"
                boxSize="4"
                color="brand.500"
                as={CheckCircleIcon}
              />
            )}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const options = [
  { label: "None", value: ChangesViewMode.NONE },
  { label: "Changes", value: ChangesViewMode.CHANGES },
  { label: "X Ray", value: ChangesViewMode.XRAY },
];

export default HighlightingModeToggle;
