import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { View } from "@multiplayer/types";
import { CheckmarkIcon, MoreDotesIcon, ViewIcon } from "shared/icons";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

const ViewListItem = ({
  view,
  selected,
  readonly,
  isSystemView,
  onClick,
  onRename,
  onDelete,
  onSetDefault,
  isRenaming,
  onViewCreate,
}: {
  view: View;
  readonly: boolean;
  isSystemView: boolean;
  selected: boolean;
  isRenaming: boolean;
  onRename?: (id: string, name: string) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  onViewCreate: (isDuplicate?: boolean) => void;
}) => {
  const { openAlertDialog } = useAlertDialog();
  const { withSandboxCheck } = useProjectSandbox();
  const [renaming, setRenaming] = useState(false);
  const [focused, setFocused] = useState(false);

  const onRenameStart = () => {
    setRenaming(true);
    setFocused(true);
  };

  useEffect(() => {
    if (isRenaming) {
      onRenameStart();
    }
  }, [isRenaming]);

  const onRenameEnd = (event) => {
    const newName = event.target.value.trim();
    if (newName && newName !== view.name) {
      onRename(view.id, newName);
    }
    setRenaming(false);
    setFocused(false);
  };

  const openConfirmationDialog = async (viewId: string) => {
    const result = await openAlertDialog({
      title: "Delete view",
    });

    if (result) {
      onDelete(viewId);
    }
  };

  return (
    <Flex
      p="8px"
      cursor="pointer"
      marginBottom="2px"
      borderRadius="8px"
      justifyContent="space-between"
      bg={selected || focused ? "brand.500" : "transparent"}
      _hover={{ background: selected || focused ? "brand.700" : "bg.subtle" }}
      onClick={() => {
        if (!renaming) {
          onClick(view.id);
        }
      }}
    >
      <Flex color={selected || focused ? "inverse" : "subtle"}>
        <Icon
          as={selected ? CheckmarkIcon : ViewIcon}
          color={!focused && !selected && "muted"}
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
            onBlur={onRenameEnd}
            defaultValue={view.name}
            onKeyDown={(e) => e.key === "Enter" && onRenameEnd(e)}
          />
        ) : (
          <Box fontSize="14px">{view.name}</Box>
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

          <MenuList zIndex="4">
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(view.id);
              }}
            >
              Set as default
            </MenuItem>
            {!isSystemView && (
              <>
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameStart();
                  }}
                >
                  Rename view
                </MenuItem>
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    withSandboxCheck(() => onViewCreate(true))();
                  }}
                >
                  Duplicate view
                </MenuItem>
                <MenuItem
                  onClick={async (e) => {
                    e.stopPropagation();
                    await openConfirmationDialog(view.id);
                  }}
                >
                  Delete view
                </MenuItem>
              </>
            )}
          </MenuList>
        </Menu>
      )}
    </Flex>
  );
};

export default ViewListItem;
