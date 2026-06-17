import { useMemo } from "react";
import { AvatarGroup, Flex } from "@chakra-ui/react";
import { useProject } from "shared/providers/ProjectContext";
import HeaderAvatar from "shared/components/HeaderAvatar";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";

const Users = () => {
  const { users } = useProject();
  const { user } = useWorkspace();

  const usersArr = useMemo(() => {
    return [...users.entries()].filter(([id]) => id !== user.data?._id);
  }, [users, user.data?._id]);

  return (
    <Flex gap="2">
      <AvatarGroup size="sm" max={4} spacing="-0.45rem">
        {usersArr.map(([id, user]) => (
          <WorkspaceUserAvatar
            key={id}
            user={user}
            userSelect="none"
            borderColor={user.color}
          />
        ))}
      </AvatarGroup>
      {user.data && <HeaderAvatar size="sm" user={user.data} />}
    </Flex>
  );
};

export default Users;
