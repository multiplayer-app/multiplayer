import { AvatarGroup, AvatarGroupProps } from "@chakra-ui/react";
import { IWorkspaceUser } from "@multiplayer/types";
import WorkspaceUserAvatar from "../WorkspaceUserAvatar/WorkspaceUserAvatar";

interface WorkspaceUserAvatarGroupProps
  extends Omit<AvatarGroupProps, "children"> {
  users: Array<string | IWorkspaceUser>;
}

const WorkspaceUserAvatarGroup = ({
  users,
  ...rest
}: WorkspaceUserAvatarGroupProps) => {
  return (
    <AvatarGroup size="xs" max={4} spacing="-0.45rem" {...rest}>
      {users?.map((user) => (
        <WorkspaceUserAvatar
          user={user}
          key={typeof user === "string" ? user : user._id}
        />
      ))}
    </AvatarGroup>
  );
};

export default WorkspaceUserAvatarGroup;
