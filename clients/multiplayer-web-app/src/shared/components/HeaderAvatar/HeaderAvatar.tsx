import { Link, useLocation, useParams } from "react-router-dom";
import { useMemo } from "react";
import {
  Avatar,
  AvatarProps,
  Box,
  Divider,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { IWorkspaceUser } from "@multiplayer/types";

import { useAuth } from "shared/providers/AuthContext";
import { unknownUser } from "shared/providers/WorkspaceContext";
import { resolveWorkspaceSettingsHref } from "shared/navigation/workspaceSettingsPath";

const HeaderAvatar = ({
  user,
  size = "m",
}: {
  user: IWorkspaceUser;
  size?: AvatarProps["size"];
}) => {
  const { pathname } = useLocation();
  const isPublicPath = pathname.startsWith("/public/");
  const {
    workspaceId: routeWorkspaceId,
    projectId: routeProjectId,
    branchId: routeBranchId,
  } = useParams<{
    workspaceId?: string;
    projectId?: string;
    branchId?: string;
  }>();

  const { signOut, user: sessionUser } = useAuth();

  const fallbackProjects = useMemo(() => {
    const ws = sessionUser?.workspaces?.find((w) => w._id === user.workspace);
    return ws?.projects ?? null;
  }, [sessionUser?.workspaces, user.workspace]);

  const profileTo = useMemo(
    () =>
      resolveWorkspaceSettingsHref(user.workspace, "profile", {
        isPublic: isPublicPath,
        routeWorkspaceId,
        routeProjectId,
        routeBranchId,
        fallbackProjects,
      }),
    [
      user.workspace,
      isPublicPath,
      routeWorkspaceId,
      routeProjectId,
      routeBranchId,
      fallbackProjects,
    ]
  );

  const linkedAccountsTo = useMemo(
    () =>
      resolveWorkspaceSettingsHref(user.workspace, "linked-accounts", {
        isPublic: isPublicPath,
        routeWorkspaceId,
        routeProjectId,
        routeBranchId,
        fallbackProjects,
      }),
    [
      user.workspace,
      isPublicPath,
      routeWorkspaceId,
      routeProjectId,
      routeBranchId,
      fallbackProjects,
    ]
  );

  const userInfo = user || unknownUser;
  const fullName =
    userInfo.firstName && userInfo.lastName
      ? `${userInfo.firstName} ${userInfo.lastName}`
      : userInfo.username || userInfo.primaryEmail;

  return (
    <>
      <Menu placement="bottom-end">
        <MenuButton>
          <Avatar
            bg={userInfo.color}
            src={userInfo.iconUrl}
            name={fullName}
            size={size}
          />
        </MenuButton>
        <MenuList minW={72}>
          <Flex mb={4} p={1}>
            <Avatar
              bg={userInfo.color}
              src={userInfo.iconUrl}
              name={fullName}
              size="m"
              mr={4}
            />
            <Box>
              <Text color="subtle" fontSize="md" fontWeight="medium">
                {fullName}
              </Text>
              {userInfo.username ? (
                <Text color="muted" fontSize="xs" fontWeight="medium">
                  @{userInfo.username}
                </Text>
              ) : null}
            </Box>
          </Flex>
          <MenuItem as={Link} state={{ backUrl: pathname }} to={profileTo}>
            Edit your profile
          </MenuItem>
          <MenuItem
            as={Link}
            state={{ backUrl: pathname }}
            to={linkedAccountsTo}
          >
            Linked Accounts
          </MenuItem>
          <Divider my="10px" />
          <MenuItem color="red.600" onClick={() => signOut()}>
            Log out
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
};

export default HeaderAvatar;
