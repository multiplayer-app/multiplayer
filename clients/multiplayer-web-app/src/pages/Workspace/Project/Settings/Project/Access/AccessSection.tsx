import { useMemo } from "react";
import {
  RoleAccessAction,
  IProject,
  ITeam,
  IWorkspaceUser,
  RoleWorkspacePermissionEntity,
  WorkspaceUserStatus,
  WorkspaceUserStatusToNameMap,
} from "@multiplayer/types";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import * as WorkspaceService from "shared/services/workspace.service";
import {
  removeProjectFromTeam,
  removeUserFromProject,
} from "shared/services/workspace.service";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import { MoreDotesIcon } from "shared/icons";
import LabelGroup from "shared/components/LabelGroup";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";
import ShareProjectModal from "pages/Workspace/Project/Settings/ShareProjectModal";
import CheckAccess from "shared/components/CheckAccess";
import useMessage from "shared/hooks/useMessage";
import { UserRoles } from "shared/models/enums";

interface Props {
  workspaceId: string;
  projectId: string;
  project: IProject;
  onUpdate: () => Promise<void>;
}

const AccessSection = ({
  workspaceId,
  projectId,
  project,
  onUpdate,
}: Props) => {
  const message = useMessage();
  const { user, users, getWorkspaceUsers } = useWorkspace();
  const { openAlertDialog } = useAlertDialog();
  const { projectRoles } = usePermissions();
  const shareProjectDisclosure = useDisclosure();

  const teamsWithAccess = useMemo((): ITeam[] => {
    return project?.teams?.sort((a, b) => a.name.localeCompare(b.name)) || [];
  }, [project]);

  const usersWithAccess = useMemo(
    (): (IWorkspaceUser & { userId: string; role: string })[] => {
      return (
        project?.users
          ?.map((u) => {
            const userObject = users.data[u.workspaceUser as string];
            return userObject
              ? { ...userObject, userId: u._id, role: u.role }
              : null;
          })
          .filter(Boolean) || []
      );
    },
    [project, users]
  );

  const isCurrentUser = (id: string) => id === user.data?._id;

  const openAccessRemoveConfirmationDialog = async (
    id: string,
    type: "team" | "user"
  ) => {
    const result = await openAlertDialog({
      title: `Remove ${type}`,
      description: `Are you sure you want to remove access to this project for this ${type}?`,
      confirmBtnLabel: "Remove",
    });
    if (result) {
      type === "team"
        ? await removeProjectFromTeam(workspaceId, projectId, id)
        : await removeUserFromProject(workspaceId, projectId, id);
      await onUpdate();
      await getWorkspaceUsers(workspaceId);
    }
  };

  const handleUserRoleUpdate = async (userId: string, role: string) => {
    try {
      await WorkspaceService.updateProjectMember(
        workspaceId,
        projectId,
        userId,
        { role }
      );
      await onUpdate();
    } catch (error) {
      message.handleError(error);
    }
  };

  const resendInvitation = async (workspaceMemberId: string) => {
    try {
      await WorkspaceService.resendWorkspaceInvitation(
        workspaceId,
        workspaceMemberId
      );
      message.success("Invitation Resent Successfully!");
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleProjectShare = async ({ email, teams, role }) => {
    const emails = email
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    try {
      const promises = [];
      teams.forEach((team: { label: string; value: string }) => {
        promises.push(
          WorkspaceService.addProjectToTeam(workspaceId, team.value, projectId)
        );
      });
      emails.forEach((email: string) => {
        promises.push(
          WorkspaceService.addUserToProject(workspaceId, projectId, {
            email,
            role,
          })
        );
      });
      await Promise.all(promises);
      await onUpdate();
      await getWorkspaceUsers(workspaceId);
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Box>
      <LabelGroup
        mb="4"
        label="Teams and members with access"
        description="Manage the access control to this project through teams and members."
      />
      <Box>
        {teamsWithAccess?.length || usersWithAccess?.length ? (
          <>
            {teamsWithAccess.map((team) => (
              <Flex
                key={team._id}
                p="1"
                gap="2"
                w="100%"
                borderRadius="8px"
                alignItems="center"
                backgroundColor="bg.primary"
                justifyContent="space-between"
              >
                <Flex gap="4" alignItems="center">
                  <Avatar
                    size="sm"
                    borderRadius="4px"
                    src={team.iconUrl}
                    name={team.name}
                  />
                  <Flex direction="column">
                    <Text mr="4">{team.name}</Text>
                    <Text mr="4" fontSize="xs" color="muted">
                      {team.users?.length} member
                      {team.users?.length === 1 ? "" : "s"}
                    </Text>
                  </Flex>
                </Flex>
                <CheckAccess
                  entity={RoleWorkspacePermissionEntity.TEAM}
                  permission={RoleAccessAction.DELETE}
                >
                  <Menu placement="bottom-end">
                    <MenuButton>
                      <Icon color="muted" as={MoreDotesIcon} />
                    </MenuButton>
                    <Portal>
                      <MenuList>
                        <MenuItem
                          color="red.500"
                          onClick={() =>
                            openAccessRemoveConfirmationDialog(
                              team._id,
                              "team"
                            )
                          }
                        >
                          Remove team's access
                        </MenuItem>
                      </MenuList>
                    </Portal>
                  </Menu>
                </CheckAccess>
              </Flex>
            ))}
            {usersWithAccess.map((u) => (
              <Flex
                key={u._id}
                p="1"
                gap="2"
                w="100%"
                borderRadius="8px"
                alignItems="center"
                backgroundColor="bg.primary"
                justifyContent="space-between"
              >
                <Flex gap="4" alignItems="center">
                  <WorkspaceUserAvatar size="sm" user={u} key={u._id} />
                  <Flex direction="column">
                    <Text mr="4">{u.username}</Text>
                    <Text mr="4" color="muted" fontSize="xs">
                      {u.primaryEmail}
                    </Text>
                  </Flex>
                </Flex>
                <Flex gap="4" alignItems="center">
                  {projectRoles && (
                    <Text color="muted" fontSize="xs" fontWeight="500">
                      {projectRoles[u.role]?.name}
                    </Text>
                  )}
                  <Tag
                    size="sm"
                    variant="subtle"
                    borderRadius="full"
                    colorScheme={WorkspaceUserStatusToNameMap[u.status].color}
                  >
                    {WorkspaceUserStatusToNameMap[u.status].label}
                  </Tag>
                  <CheckAccess
                    entity={RoleWorkspacePermissionEntity.WORKSPACE_MEMBER}
                    permission={RoleAccessAction.UPDATE}
                  >
                    <Menu placement="bottom-end">
                      <MenuButton>
                        <Icon color="muted" as={MoreDotesIcon} />
                      </MenuButton>
                      <Portal>
                        <MenuList>
                          {!isCurrentUser(u._id) &&
                            Object.values(projectRoles).map((role) =>
                              role._id !== u.role ? (
                                <MenuItem
                                  key={role._id}
                                  onClick={async () =>
                                    handleUserRoleUpdate(u.userId, role._id)
                                  }
                                >
                                  Make{" "}
                                  {role.name === UserRoles.ADMIN ? "an" : "a"}{" "}
                                  {role.name}
                                </MenuItem>
                              ) : null
                            )}
                          {u.status === WorkspaceUserStatus.PENDING && (
                            <MenuItem onClick={() => resendInvitation(u._id)}>
                              Resend invitation
                            </MenuItem>
                          )}
                          <MenuItem
                            color="red.500"
                            onClick={() =>
                              openAccessRemoveConfirmationDialog(
                                u.userId,
                                "user"
                              )
                            }
                          >
                            Remove user's access
                          </MenuItem>
                        </MenuList>
                      </Portal>
                    </Menu>
                  </CheckAccess>
                </Flex>
              </Flex>
            ))}
          </>
        ) : (
          <Flex py="4" fontSize="sm" justifyContent="center">
            This project is not shared with any teams or members.
          </Flex>
        )}
        <CheckAccess
          entity={RoleWorkspacePermissionEntity.WORKSPACE_MEMBER}
          permission={RoleAccessAction.UPDATE}
        >
          <Button
            mt="4"
            variant="light"
            onClick={shareProjectDisclosure.onOpen}
          >
            Share project
          </Button>
        </CheckAccess>
      </Box>
      <ShareProjectModal
        onSubmit={handleProjectShare}
        teamsWithAccess={teamsWithAccess}
        disclosure={shareProjectDisclosure}
      />
    </Box>
  );
};

export default AccessSection;
