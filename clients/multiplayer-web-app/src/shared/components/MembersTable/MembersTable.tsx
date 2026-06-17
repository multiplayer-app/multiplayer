import { useMemo } from "react";
import {
  Avatar,
  Box,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";

import {
  RoleAccessAction,
  ITeamMember,
  IWorkspaceMember,
  IWorkspaceUser,
  RoleType,
  WorkspaceUserStatus,
  WorkspaceUserStatusToNameMap,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import {
  AlertTypes,
  useAlertDialog,
} from "shared/providers/AlertDialogContext";
import { useAuth } from "shared/providers/AuthContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";

import { MoreDotesIcon } from "shared/icons";
import { usePermissions } from "shared/providers/PermissionsContext";
import { getNestedProperty } from "shared/utils";
import { UserRoles } from "shared/models/enums";
import CheckAccess from "shared/components/CheckAccess";

const MembersTable = ({
  data,
  type,
  onRemove,
  onLeave,
  onResend,
  onRoleUpdate,
}: {
  data: any[];
  type: RoleType;
  onRemove?: (arg: string, isCurrentUsersLastWorkspace: boolean) => void;
  onLeave?: (isCurrentUsersLastWorkspace: boolean) => void;
  onResend?: (arg: string) => void;
  onRoleUpdate?: (userId: string, role: string) => void;
}) => {
  const {
    roles: { data: roles },
    workspaceRoles,
  } = usePermissions();
  const { user } = useWorkspace();
  const { user: currentUser } = useAuth();
  const { openAlertDialog } = useAlertDialog();
  const unitName = type === RoleType.WORKSPACE ? "workspace" : "team";

  type MemberType<T> = T extends RoleType.WORKSPACE
    ? IWorkspaceMember
    : ITeamMember;

  const openRemoveConfirmationDialog = async (
    member: MemberType<typeof type>
  ): Promise<void> => {
    const isLoggedInUser = isCurrentUser(
      (member.workspaceUser as IWorkspaceUser)._id
    );

    if (
      type === RoleType.WORKSPACE &&
      isLoggedInUser &&
      workspaceRoles[member.role].name === UserRoles.ADMIN &&
      workspaceAdminsCount === 1
    ) {
      await openAlertDialog({
        title: "Warning",
        description:
          "You should assign someone as an admin before leaving the workspace",
        type: AlertTypes.WARNING,
        showConfirmButton: false,
        closeBtnLabel: "Close",
      });
    } else {
      const result = await openAlertDialog({
        title: isLoggedInUser ? `Leave ${unitName}` : "Remove member",
        confirmBtnLabel: isLoggedInUser ? "Confirm" : "Remove",
      });

      const isCurrentUsersLastWorkspace =
        isLoggedInUser && currentUser.workspaces.length === 1;

      if (result) {
        isLoggedInUser
          ? onLeave(isCurrentUsersLastWorkspace)
          : onRemove(member._id, isCurrentUsersLastWorkspace);
      }
    }
  };

  const isCurrentUser = (id: string): boolean => {
    return id === user.data?._id;
  };

  const workspaceAdminsCount = useMemo((): number => {
    return data.filter((i) =>
      getNestedProperty(workspaceRoles, [i.role, "workspaceAdmin"], false)
    ).length;
  }, [data, workspaceRoles]);

  const leaveSpaceMenu = (member: MemberType<typeof type>) =>
    isCurrentUser((member.workspaceUser as IWorkspaceUser)._id) ? (
      <Menu placement="bottom-end">
        <MenuButton>
          <Icon color="muted" as={MoreDotesIcon} />
        </MenuButton>
        <MenuList>
          <MenuItem
            color="red.500"
            onClick={() => openRemoveConfirmationDialog(member)}
          >
            {`Leave ${unitName}`}
          </MenuItem>
        </MenuList>
      </Menu>
    ) : null;

  const MembersMenuList = ({ userInfo, member }) => {
    return (
      <MenuList>
        {isCurrentUser(userInfo._id) && (
          <MenuItem
            color="red.500"
            onClick={() => openRemoveConfirmationDialog(member)}
          >
            {`Leave ${unitName}`}
          </MenuItem>
        )}
        {!isCurrentUser(userInfo._id) &&
          roles[type] &&
          Object.values(roles[type]).map((role) =>
            role._id !== member.role && role.name !== UserRoles.OWNER ? (
              <MenuItem
                key={role._id}
                onClick={async () => {
                  onRoleUpdate(member._id, role._id);
                }}
              >
                Make {role.name === UserRoles.ADMIN ? "an" : "a"} {role.name}
              </MenuItem>
            ) : null
          )}
        {userInfo.status === WorkspaceUserStatus.PENDING && (
          <MenuItem onClick={() => onResend(userInfo._id)}>
            Resend invitation
          </MenuItem>
        )}
        {!isCurrentUser(userInfo._id) && (
          <CheckAccess
            entity={RoleWorkspacePermissionEntity.WORKSPACE_MEMBER}
            permission={RoleAccessAction.DELETE}
          >
            <MenuItem
              color="red.500"
              onClick={() => openRemoveConfirmationDialog(member)}
            >
              Remove member
            </MenuItem>
          </CheckAccess>
        )}
      </MenuList>
    );
  };

  return (
    <>
      {/* DESKTOP TABLE */}
      <Box display={{ base: "none", md: "block" }}>
        <TableContainer>
          <Table variant="custom" size="sm" layout="fixed">
            <Thead>
              <Tr>
                <Th>MEMBER</Th>
                <Th width="150px">ACCESS LEVEL</Th>
                <Th width="110px">STATUS</Th>
                <Th isNumeric width="22%"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.length ? (
                data.map((member: MemberType<typeof type>) => {
                  const userInfo = member.workspaceUser as IWorkspaceUser;
                  return (
                    <Tr key={member._id}>
                      <Td>
                        <Flex alignItems="center">
                          <Avatar
                            mr="2"
                            size="s"
                            bg={userInfo.color}
                            src={userInfo.iconUrl}
                          />
                          <Text noOfLines={1} display="block">
                            {userInfo.primaryEmail || userInfo.username}
                          </Text>
                        </Flex>
                      </Td>
                      <Td>
                        <Tag size="sm" variant="subtle" borderRadius="full">
                          {getNestedProperty<string>(
                            roles,
                            [type, member.role, "name"],
                            "-"
                          )}
                        </Tag>
                      </Td>
                      <Td>
                        <Tag
                          size="sm"
                          variant="subtle"
                          borderRadius="full"
                          colorScheme={
                            WorkspaceUserStatusToNameMap[userInfo.status].color
                          }
                        >
                          {WorkspaceUserStatusToNameMap[userInfo.status].label}
                        </Tag>
                      </Td>
                      <Td isNumeric textAlign="right">
                        {!!onRemove && (
                          <CheckAccess
                            entity={
                              RoleWorkspacePermissionEntity.WORKSPACE_MEMBER
                            }
                            permission={RoleAccessAction.UPDATE}
                            fallbackElement={leaveSpaceMenu(member)}
                          >
                            <Menu placement="bottom-end">
                              <MenuButton>
                                <Icon color="muted" as={MoreDotesIcon} />
                              </MenuButton>
                              <MembersMenuList
                                userInfo={userInfo}
                                member={member}
                              />
                            </Menu>
                          </CheckAccess>
                        )}
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={4}>
                    <Text textAlign="center" color="muted">
                      There are no members yet!
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
      {/* MOBILE CARDS */}
      <Stack spacing={3} display={{ base: "flex", md: "none" }}>
        {data.length ? (
          data.map((member: MemberType<typeof type>) => {
            const userInfo = member.workspaceUser as IWorkspaceUser;

            return (
              <Box key={member._id} borderWidth="1px" borderRadius="md" p={3}>
                <Flex justify="space-between" align="flex-start">
                  <Flex gap={2} align="center">
                    <Avatar
                      size="sm"
                      bg={userInfo.color}
                      src={userInfo.iconUrl}
                    />
                    <Box>
                      <Text fontWeight="medium" noOfLines={1}>
                        {userInfo.primaryEmail || userInfo.username}
                      </Text>
                      <Text fontSize="xs" color="muted">
                        {WorkspaceUserStatusToNameMap[userInfo.status].label}
                      </Text>
                    </Box>
                  </Flex>

                  {!!onRemove && (
                    <Menu placement="bottom-end">
                      <MenuButton>
                        <Icon as={MoreDotesIcon} color="muted" />
                      </MenuButton>
                      <MembersMenuList userInfo={userInfo} member={member} />
                    </Menu>
                  )}
                </Flex>

                <Flex mt={3} gap={2} wrap="wrap">
                  <Tag size="sm" variant="subtle" borderRadius="full">
                    {getNestedProperty<string>(
                      roles,
                      [type, member.role, "name"],
                      "-"
                    )}
                  </Tag>

                  <Tag
                    size="sm"
                    variant="subtle"
                    borderRadius="full"
                    colorScheme={
                      WorkspaceUserStatusToNameMap[userInfo.status].color
                    }
                  >
                    {WorkspaceUserStatusToNameMap[userInfo.status].label}
                  </Tag>
                </Flex>
              </Box>
            );
          })
        ) : (
          <Text textAlign="center" color="muted">
            There are no members yet!
          </Text>
        )}
      </Stack>
    </>
  );
};

export default MembersTable;
