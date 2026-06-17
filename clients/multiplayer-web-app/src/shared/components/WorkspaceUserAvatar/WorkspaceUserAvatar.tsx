import { Avatar, AvatarProps, Tooltip } from "@chakra-ui/react";
import { IWorkspaceUser } from "@multiplayer/types";
import { memo } from "react";
import {
  unknownUser,
  useWorkspaceUsers,
} from "shared/providers/WorkspaceContext";

interface WorkspaceUserAvatarProps extends AvatarProps {
  user: string | IWorkspaceUser;
  showTooltip?: boolean;
}

const WorkspaceUserAvatar = ({
  user,
  showTooltip = true,
  ...rest
}: WorkspaceUserAvatarProps) => {
  const workspaceUsers = useWorkspaceUsers();
  const userInfo =
    (typeof user === "string" ? workspaceUsers[user] : user) || unknownUser;

  const fullName =
    userInfo.firstName && userInfo.lastName
      ? `${userInfo.firstName} ${userInfo.lastName}`
      : userInfo.username;

  return (
    <Tooltip label={showTooltip ? fullName : null}>
      <Avatar
        bg={userInfo.color}
        src={userInfo.iconUrl}
        name={fullName}
        {...rest}
      />
    </Tooltip>
  );
};

export default memo(WorkspaceUserAvatar);
