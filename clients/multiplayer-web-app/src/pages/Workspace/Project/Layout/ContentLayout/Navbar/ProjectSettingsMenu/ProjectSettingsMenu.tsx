import {
  Menu,
  Icon,
  Switch,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuButton,
} from "@chakra-ui/react";
import { CogOIcon } from "shared/icons";
import { useProject } from "shared/providers/ProjectContext";
import { useTabs } from "shared/providers/TabsContext";
import NavbarNavItem from "../NavbarNavItem";

interface ProjectSettingsMenuProps {
  isExpanded: boolean;
}

const ProjectSettingsMenu = ({ isExpanded }: ProjectSettingsMenuProps) => {
  const { layoutState, setLayoutState } = useProject();
  const { clearTabs } = useTabs();

  return (
    <Menu closeOnSelect={false} placement="right-end">
      <NavbarNavItem
        mb="2"
        as={MenuButton}
        label="Settings"
        isExpanded={isExpanded}
        icon={<Icon boxSize="6" color="muted" as={CogOIcon} />}
        _hover={{ textDecoration: "none" }}
      />

      <MenuList>
        <MenuGroup title="Layout settings" mx="2" mt="0">
          <MenuItem
            display="flex"
            autoFocus={false}
            alignItems="center"
            justifyContent="space-between"
            _hover={{ bg: "none" }}
          >
            Show tabs{" "}
            <Switch
              size="md"
              colorScheme="brand"
              isChecked={layoutState.showTabs}
              onChange={() => {
                if (layoutState.showTabs) {
                  clearTabs();
                }
                setLayoutState((prev) => ({
                  ...prev,
                  showTabs: !prev.showTabs,
                }));
              }}
            />
          </MenuItem>
        </MenuGroup>
      </MenuList>
    </Menu>
  );
};

export default ProjectSettingsMenu;
