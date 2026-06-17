import { IWorkspaceUser } from "@multiplayer/types";
import {
  unknownUser,
  useWorkspaceUsers,
} from "shared/providers/WorkspaceContext";

interface WorkspaceUserNameProps {
  user: string | IWorkspaceUser;
}

const WorkspaceUserName = ({ user }: WorkspaceUserNameProps) => {
  const workspaceUsers = useWorkspaceUsers();
  const userInfo =
    (typeof user === "string" ? workspaceUsers[user] : user) || unknownUser;
  const fullName =
    userInfo.firstName && userInfo.lastName
      ? `${userInfo.firstName} ${userInfo.lastName}`
      : userInfo.username;

  return <>{fullName}</>;
};

export default WorkspaceUserName;
