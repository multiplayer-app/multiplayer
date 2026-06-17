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

import { isSystemView } from "shared/helpers/diagram.helpers";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useApis } from "shared/providers/ApisContext";

interface ViewItemProps {
  view: any;
  readonly: boolean;
  isActive: boolean;
  onClick: () => void;
}

const ViewItem = ({ isActive, readonly, view, onClick }: ViewItemProps) => {
  const [renaming, setRenaming] = useState(false);
  const [focused, setFocused] = useState(false);
  const { openAlertDialog } = useAlertDialog();
  const { onViewUpdate, onViewDelete, onDefaultViewChange } = useApis();

  const handleRenameEnd = (event) => {
    const name = event.target.value.trim();
    if (name && name !== view.name) {
      onViewUpdate(view.id, { ...view, name });
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
    if (result) onViewDelete(view.id);
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
        />

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
      {!readonly && (
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
            <MenuItem
              onClick={() => {
                onDefaultViewChange(view.id);
              }}
            >
              Set as default
            </MenuItem>
            {!isSystemView(view.id) && (
              <>
                <MenuItem onClick={handleRename}>Rename view</MenuItem>
                <MenuItem onClick={handleDelete}>Delete view</MenuItem>
              </>
            )}
          </MenuList>
        </Menu>
      )}
    </Flex>
  );
};

export default ViewItem;
