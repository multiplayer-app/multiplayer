import { useMemo } from "react";
import {
  EntityType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import {
  Icon,
  Menu,
  Text,
  Button,
  MenuItem,
  MenuList,
  MenuButton,
  MenuDivider,
  useDisclosure,
} from "@chakra-ui/react";

import { MoreDotesIcon } from "shared/icons";
import { useTabs } from "shared/providers/TabsContext";
import { EntityWithMeta } from "shared/models/interfaces";
import { useVersion } from "shared/providers/VersionContext";
import { useEntities } from "shared/providers/EntitiesContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";

import ExplorerItem from "shared/components/ExplorerItem";
import EntityMetaIcon from "shared/components/EntityMetaIcon";
import EditEntityNameModal from "shared/components/EditEntityNameModal";
import { Link } from "react-router-dom";
import { ProjectSourceType } from "shared/models/enums";
import CheckAccess from "shared/components/CheckAccess";

const EntitiesHavingAlias = [
  EntityType.ENVIRONMENT,
  EntityType.PLATFORM_COMPONENT,
];

const EntityItem = ({
  entity,
  isActive,
}: {
  entity: EntityWithMeta;
  isActive: boolean;
}) => {
  const { focusTab } = useTabs();
  const { openAlertDialog } = useAlertDialog();
  const { isCurrentBranchLocked } = useVersion();
  const editNameModalDisclosure = useDisclosure();

  const { onEntityDelete, onEntityUpdate } = useEntities();

  const onRenameClick = () => {
    editNameModalDisclosure.onOpen();
  };

  const shouldShowAliasToggle = useMemo(() => {
    return EntitiesHavingAlias.includes(entity.type);
  }, [entity]);

  const handleNameChange = (
    newName: string,
    shouldAddAlias: boolean = false
  ) => {
    onEntityUpdate(entity.entityId, {
      key: newName,
      ...(shouldAddAlias && { keyAliases: [...entity.keyAliases, entity.key] }),
    });
  };

  const openDeleteConfirmationDialog = async (
    entityId: string,
    entityType: string
  ) => {
    const result = await openAlertDialog({
      title: "Delete",
    });

    if (result) {
      onEntityDelete(entityId, entityType);
    }
  };

  const entityPath = `${ProjectSourceType.ENTITY}/${entity.type}/${entity.entityId}`;

  return (
    <ExplorerItem isActive={isActive} onDoubleClick={focusTab}>
      <Button
        as={Link}
        px="2"
        w="full"
        display="flex"
        flex="1"
        h="inherit"
        color="inherit"
        textAlign="left"
        alignItems="center"
        to={entityPath}
        leftIcon={
          <EntityMetaIcon metadata={entity.metadata} type={entity.type} />
        }
        variant="unstyled"
        transition="none"
        fontWeight="inherit"
      >
        <Text
          as="span"
          flex="1"
          minW="0"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
        >
          {entity.key || "unknown"}
        </Text>
      </Button>
      <Menu isLazy placement="bottom-end">
        <MenuButton
          px="2"
          opacity="0"
          _groupHover={{ opacity: "1" }}
          transition="opacity .2s cubic-bezier(.87, 0, .13, 1)"
        >
          <Icon as={MoreDotesIcon} />
        </MenuButton>
        <MenuList>
          <MenuItem as={Link} to={entityPath}>
            Open
          </MenuItem>
          {!isCurrentBranchLocked && (
            <>
              <CheckAccess
                entity={RoleProjectPermissionEntity.ENTITY}
                permission={RoleAccessAction.UPDATE}
                scope={RoleType.PROJECT}
              >
                <MenuItem onClick={onRenameClick}>Rename</MenuItem>
              </CheckAccess>
              <CheckAccess
                entity={RoleProjectPermissionEntity.ENTITY}
                permission={RoleAccessAction.DELETE}
                scope={RoleType.PROJECT}
              >
                <MenuDivider />
                <MenuItem
                  color="red.500"
                  onClick={() =>
                    openDeleteConfirmationDialog(entity.entityId, entity.type)
                  }
                >
                  Delete
                </MenuItem>
              </CheckAccess>
            </>
          )}
        </MenuList>
      </Menu>
      <EditEntityNameModal
        previousName={entity.key}
        disclosure={editNameModalDisclosure}
        shouldShowAliasToggle={shouldShowAliasToggle}
        onNameChange={handleNameChange}
      />
    </ExplorerItem>
  );
};

export default EntityItem;
