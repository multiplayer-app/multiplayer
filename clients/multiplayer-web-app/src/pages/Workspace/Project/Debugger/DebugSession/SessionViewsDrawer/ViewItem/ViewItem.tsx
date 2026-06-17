import {
  Icon,
  Menu,
  Flex,
  Input,
  MenuList,
  MenuItem,
  IconButton,
  MenuButton,
} from "@chakra-ui/react";
import { CheckmarkIcon, ViewIcon, MoreDotesIcon } from "shared/icons";
import { useState } from "react";

import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useDebugSession } from "../../DebugSessionContext";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import CheckAccess from "shared/components/CheckAccess";

interface ViewItemProps {
  view: any;
  isActive: boolean;
  isSystemView: boolean;
  onClick: () => void;
}

const ViewItem = ({ isActive, view, isSystemView, onClick }: ViewItemProps) => {
  const [renaming, setRenaming] = useState(false);
  const [focused, setFocused] = useState(false);
  const { openAlertDialog } = useAlertDialog();
  const { onViewDelete, onViewUpdate } = useDebugSession();

  const handleRenameEnd = (event) => {
    const name = event.target.value.trim();
    if (name && name !== view.name) {
      const { _id, ...rest } = view;
      onViewUpdate(_id, { ...rest, name });
    }
    setRenaming(false);
    setFocused(false);
  };

  const handleRename = () => {
    setRenaming(true);
    setFocused(true);
  };

  const handleDelete = async () => {
    const result = await openAlertDialog({ title: "Delete view" });
    if (result) onViewDelete(view._id);
  };

  return (
    <Flex
      p="8px"
      cursor="pointer"
      marginBottom="2px"
      borderRadius="8px"
      justifyContent="space-between"
      bg={isActive || focused ? "brand.500" : "transparent"}
      _hover={{ background: isActive || focused ? "brand.700" : "bg.subtle" }}
      onClick={() => {
        if (renaming) return;
        onClick();
      }}
    >
      <Flex color={isActive || focused ? "inverse" : "subtle"}>
        <Icon
          as={isActive ? CheckmarkIcon : ViewIcon}
          color={focused || isActive ? "inherit" : "muted"}
          mr="8px"
          w="16px"
        ></Icon>
        {renaming ? (
          <Input
            autoFocus
            h="inherit"
            color="inverse"
            fontWeight="inherit"
            variant="unstyled"
            onBlur={handleRenameEnd}
            defaultValue={view.name}
            onKeyDown={(e) => e.key === "Enter" && handleRenameEnd(e)}
          />
        ) : (
          view.name
        )}
      </Flex>
      {!isSystemView && (
        <CheckAccess
          entity={RoleProjectPermissionEntity.DEBUG_SESSION}
          permission={RoleAccessAction.UPDATE}
          scope={RoleType.PROJECT}
        >
          <Menu placement="bottom">
            <IconButton
              h="21px"
              variant="base"
              minWidth="16px"
              as={MenuButton}
              aria-label="viewSettings"
              icon={<Icon as={MoreDotesIcon} color="muted" />}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />

            <MenuList zIndex="4" onClick={(e) => e.stopPropagation()}>
              {/* <MenuItem onClick={() => onDefaultViewChange(view.id)}>Set as default</MenuItem> */}
              <MenuItem onClick={handleRename}>Rename view</MenuItem>
              <MenuItem onClick={handleDelete}>Delete view</MenuItem>
            </MenuList>
          </Menu>
        </CheckAccess>
      )}
    </Flex>
  );
};

export default ViewItem;
