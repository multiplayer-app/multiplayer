import {
  Flex,
  Icon,
  Text,
  Menu,
  Input,
  MenuList,
  MenuItem,
  MenuButton,
  MenuDivider,
} from "@chakra-ui/react";
import { useState } from "react";
import { IEntityCommit } from "@multiplayer/types";

import { MoreIcon } from "shared/icons";
import { getNestedProperty } from "shared/utils";
import Pluralize from "shared/components/Pluralize";
import TimeAgo from "shared/components/TimeAgo";
import WorkspaceUserName from "shared/components/WorkspaceUserName";
import WorkspaceUserAvatarGroup from "shared/components/WorkspaceUserAvatarGroup";
import { config } from "../../../../../config";

interface VersionsHistoryItemProps {
  data: IEntityCommit;
  isActive: boolean;
  onRestore: (version: IEntityCommit) => void;
  onRename: (version: IEntityCommit, name: string) => void;
  onCopy: (version: IEntityCommit) => void;
  printContent?: (version: IEntityCommit) => void;
}

const VersionsHistoryItem = ({
  data,
  isActive,
  onRename,
  onRestore,
  onCopy,
  printContent,
}: VersionsHistoryItemProps) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.name);
  const users = getNestedProperty(data, ["commit", "workspaceUsers"], []);

  const onRenamingEnd = (e) => {
    const newName = e.target.value.trim();
    if (newName && newName !== name) {
      onRename(data, newName);
      setName(newName);
    }
    setEditing(false);
  };

  const handleKeydown = (e) => {
    if (e.key === "Enter") {
      onRenamingEnd(e);
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  };

  return (
    <Flex
      py="2"
      px="4"
      borderRadius="md"
      border="solid 1px"
      alignItems="center"
      borderColor="border.secondary"
    >
      <Flex direction="column" flex="1" gap="1">
        {editing ? (
          <Input
            p="0"
            h="auto"
            autoFocus
            variant="base"
            maxLength={100}
            fontWeight="medium"
            defaultValue={name}
            onBlur={onRenamingEnd}
            onKeyDown={handleKeydown}
          />
        ) : name ? (
          <Text fontWeight="medium">{name}</Text>
        ) : null}
        <Text color={name ? "muted" : "body"}>
          <TimeAgo date={data.commit?.createdAt} />
        </Text>
        <Flex alignItems="center" gap="2">
          <WorkspaceUserAvatarGroup users={users} />
          <Text color="muted">
            <WorkspaceUserName user={users && users[0]} />
            {users?.length > 1 ? (
              <>
                {" and other "}
                <Pluralize singular={"user"} count={users?.length - 1} />.
              </>
            ) : null}
          </Text>
        </Flex>
      </Flex>
      <Menu isLazy placement="bottom-end" size="sm">
        <MenuButton>
          <Icon as={MoreIcon} />
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => setEditing((prev) => !prev)}>
            Name this version
          </MenuItem>
          <MenuItem isDisabled onClick={() => onCopy(data)}>
            Make a copy
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={() => onRestore(data)}>
            Restore to this version
          </MenuItem>
          {config.REACT_APP_PLATFORM_ENV !== "production" && (
            <MenuItem onClick={() => printContent(data)}>
              Log commit content
            </MenuItem>
          )}
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default VersionsHistoryItem;
