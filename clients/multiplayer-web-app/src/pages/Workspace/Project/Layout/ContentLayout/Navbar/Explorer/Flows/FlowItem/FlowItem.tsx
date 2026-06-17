import { useState } from "react";

import {
  Flex,
  Icon,
  Input,
  Text,
  Menu,
  Button,
  MenuItem,
  MenuList,
  InputGroup,
  MenuButton,
  MenuDivider,
  InputLeftElement,
} from "@chakra-ui/react";
import {
  IFlowMetadata,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import { FlowIcon, MoreDotesIcon } from "shared/icons";
import ExplorerItem from "shared/components/ExplorerItem";

import { useTabs } from "shared/providers/TabsContext";
import { useFlows } from "shared/providers/FlowsContext";
import CheckAccess from "shared/components/CheckAccess";

const FlowItem = ({
  data,
  isActive,
}: {
  data: IFlowMetadata;
  isActive: boolean;
}) => {
  const { onFlowOpen } = useTabs();
  const [editMode, setEditMode] = useState(false);
  const { onDelete, onUpdate } = useFlows();
  const onEditingStart = () => {
    setEditMode(true);
  };

  const onEditingEnd = async (event) => {
    const name = event.target.value.trim();
    if (name !== data.name) {
      await onUpdate(data.id, { name });
    }
    setEditMode(false);
  };

  const openConfirmationDialog = async () => {
    const { id } = data;
    onDelete(id);
  };

  return (
    <ExplorerItem isActive={isActive}>
      {editMode ? (
        <InputGroup h="inherit">
          <InputLeftElement h="inherit" w="9" px="0">
            <Icon as={FlowIcon} />
          </InputLeftElement>
          <Input
            autoFocus
            pl="9"
            h="inherit"
            color="inherit"
            variant="unstyled"
            fontWeight="inherit"
            onBlur={onEditingEnd}
            defaultValue={data.name}
            onKeyDown={(e) => e.key === "Enter" && onEditingEnd(e)}
          />
        </InputGroup>
      ) : (
        <Flex
          as={Button}
          px="2"
          w="full"
          flex="1"
          h="inherit"
          textAlign="left"
          color="inherit"
          variant="unstyled"
          transition="none"
          fontWeight="inherit"
          leftIcon={<Icon as={FlowIcon} />}
          onClick={() => onFlowOpen(data)}
        >
          <Text
            as="span"
            flex="1"
            minW="0"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
          >
            {data.name || "unknown"}
          </Text>
        </Flex>
      )}
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
          <MenuItem onClick={() => onFlowOpen(data)}>Open</MenuItem>
          <CheckAccess
            entity={RoleProjectPermissionEntity.FLOW}
            permission={RoleAccessAction.UPDATE}
            scope={RoleType.PROJECT}
          >
            <MenuItem onClick={onEditingStart}>Rename</MenuItem>
          </CheckAccess>
          <CheckAccess
            entity={RoleProjectPermissionEntity.FLOW}
            permission={RoleAccessAction.DELETE}
            scope={RoleType.PROJECT}
          >
            <MenuDivider />
            <MenuItem color="red.500" onClick={openConfirmationDialog}>
              Delete
            </MenuItem>
          </CheckAccess>
        </MenuList>
      </Menu>
    </ExplorerItem>
  );
};

export default FlowItem;
