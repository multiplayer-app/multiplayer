import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Flex,
  FormControl,
  InputGroup,
  Input,
  InputRightElement,
  Button,
  Stack,
  Switch,
  Select,
  FormLabel,
  useDisclosure,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Portal,
} from "@chakra-ui/react";
import { MoreDotesIcon, VerifiedIcon } from "shared/icons";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";

import LabelGroup from "shared/components/LabelGroup";
import TimeAgo from "shared/components/TimeAgo";
import AddDomainModal from "./AddDomainModal/AddDomainModal";
import * as WorkspaceService from "shared/services/workspace.service";
import useMessage from "shared/hooks/useMessage";
import { IWorkspaceDomain, IWorkspaceSettings } from "@multiplayer/types";
import { usePermissions } from "shared/providers/PermissionsContext";

const WorkspaceDomain = () => {
  const message = useMessage();
  const { workspaceId } = useParams();
  const { workspace, getWorkspace, updateWorkspace } = useWorkspace();
  const { workspaceRoles, projectRoles } = usePermissions();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { openAlertDialog } = useAlertDialog();
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const workspaceRoleOptions = useMemo(
    () => Object.values(workspaceRoles || {}).filter((role) => !role.workspaceOwner),
    [workspaceRoles]
  );
  const defaultWorkspaceRole = useMemo(
    () =>
      workspaceRoleOptions.find((role) => role.default) ||
      workspaceRoleOptions[0],
    [workspaceRoleOptions]
  );
  const projectRoleOptions = useMemo(
    () => Object.values(projectRoles || {}),
    [projectRoles]
  );
  const defaultProjectRole = useMemo(
    () => projectRoleOptions.find((role) => role.default) || projectRoleOptions[0],
    [projectRoleOptions]
  );
  const hasDomains = !!workspace.data.domains.length;
  const domainAutoJoin = workspace.data.settings?.domainAutoJoin;
  const memberProjectAccess = workspace.data.settings?.memberProjectAccess;
  const selectedWorkspaceRoleId =
    domainAutoJoin?.workspaceRoleId || defaultWorkspaceRole?._id || "";
  const selectedProjectRoleId =
    memberProjectAccess?.projectRoleId || defaultProjectRole?._id || "";

  const saveWorkspaceSettings = async (settings: Partial<IWorkspaceSettings>) => {
    try {
      setIsSavingSettings(true);
      const res = await WorkspaceService.updateWorkspace(workspaceId, {
        settings: {
          ...workspace.data.settings,
          ...settings,
        },
      });
      updateWorkspace(res);
    } catch (error) {
      message.handleError(error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleClose = (res) => {
    if (res) {
      getWorkspace(workspaceId);
    }
    onClose();
  };

  const handleRemove = async (domain: IWorkspaceDomain) => {
    try {
      await WorkspaceService.deleteWorkspaceDomain(workspaceId, domain._id);
      getWorkspace(workspaceId);
    } catch (error) {
      message.handleError(error);
    }
  };

  const openConfirmationDialog = async (domain: IWorkspaceDomain) => {
    const result = await openAlertDialog({
      title: "Remove Domain",
    });

    if (result) {
      await handleRemove(domain);
    }
  };

  const handleDomainAutoJoinToggle = async (e) => {
    await saveWorkspaceSettings({
      domainAutoJoin: {
        enabled: e.target.checked,
        workspaceRoleId:
          domainAutoJoin?.workspaceRoleId || defaultWorkspaceRole?._id || null,
      },
    });
  };

  const handleWorkspaceRoleChange = async (e) => {
    await saveWorkspaceSettings({
      domainAutoJoin: {
        enabled: !!domainAutoJoin?.enabled,
        workspaceRoleId: e.target.value || null,
      },
    });
  };

  const handleMemberProjectAccessToggle = async (e) => {
    await saveWorkspaceSettings({
      memberProjectAccess: {
        ...memberProjectAccess,
        enabled: e.target.checked,
        projectRoleId:
          memberProjectAccess?.projectRoleId ||
          defaultProjectRole?._id,
      },
    });
  };

  const handleProjectRoleChange = async (e) => {
    await saveWorkspaceSettings({
      memberProjectAccess: {
        enabled: memberProjectAccess?.enabled !== false,
        projectRoleId: e.target.value,
      },
    });
  };

  return (
    <>
      <FormControl mb="10">
        <LabelGroup
          mb="4"
          label="Allowed email domains"
          description="Anyone with an email address at these domains is allowed to sign-up
    for this workspace."
        />
        <Button onClick={onOpen} leftIcon={<VerifiedIcon />}>
          Add domain
        </Button>
        {!!workspace.data.domains.length && (
          <Stack mt="4">
            {workspace.data.domains.map((item) => (
              <InputGroup key={item._id}>
                <Input type="text" defaultValue={item.domain} readOnly />
                <InputRightElement
                  w="64"
                  color="muted"
                  justifyContent="flex-end"
                  pr="3"
                  gap="5"
                  children={
                    <>
                      <Text color="muted">
                        <TimeAgo date={item.createdAt} />
                      </Text>
                      <Menu placement="bottom-end">
                        <MenuButton>
                          <Icon color="muted" as={MoreDotesIcon} />
                        </MenuButton>
                        <Portal>
                          <MenuList>
                            <MenuItem
                              color="red.500"
                              onClick={() => openConfirmationDialog(item)}
                            >
                              Remove Domain
                            </MenuItem>
                          </MenuList>
                        </Portal>
                      </Menu>
                    </>
                  }
                />
              </InputGroup>
            ))}
          </Stack>
        )}
      </FormControl>

      <Stack spacing="6" mb="10">
        <Box
          p="4"
          bg="bg.subtle"
          borderRadius="lg"
          border="solid 1px"
          borderColor="border.secondary"
        >
          <FormControl>
            <Flex alignItems="center" gap="6" justifyContent="space-between">
              <LabelGroup
                flex="1"
                label="Auto-add users by domain"
                description={
                  hasDomains
                    ? "Automatically add new users with matching email domains to this workspace."
                    : "Add an allowed email domain first. Auto-add only works for domains listed above."
                }
              />
              <Switch
                isChecked={!!domainAutoJoin?.enabled}
                isDisabled={
                  !hasDomains ||
                  !workspaceRoleOptions.length ||
                  isSavingSettings
                }
                onChange={handleDomainAutoJoinToggle}
              />
            </Flex>

            <Box mt="4" maxW="320px">
              <FormLabel>Select default role</FormLabel>
              <Select
                size="sm"
                value={selectedWorkspaceRoleId}
                isDisabled={
                  !hasDomains ||
                  !domainAutoJoin?.enabled ||
                  !workspaceRoleOptions.length ||
                  isSavingSettings
                }
                onChange={handleWorkspaceRoleChange}
              >
                {workspaceRoleOptions.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </Box>
          </FormControl>
        </Box>

        <Box
          p="4"
          bg="bg.subtle"
          borderRadius="lg"
          border="solid 1px"
          borderColor="border.secondary"
        >
          <FormControl>
            <Flex alignItems="center" gap="6" justifyContent="space-between">
              <LabelGroup
                flex="1"
                label="Show all projects by default"
                description="When enabled, all workspace members can see all projects unless they are assigned to specific projects explicitly."
              />
              <Switch
                isChecked={memberProjectAccess?.enabled !== false}
                isDisabled={!projectRoleOptions.length || isSavingSettings}
                onChange={handleMemberProjectAccessToggle}
              />
            </Flex>

            <Box mt="4" maxW="320px">
              <FormLabel>Select default project role</FormLabel>
              <Select
                size="sm"
                value={selectedProjectRoleId}
                isDisabled={
                  memberProjectAccess?.enabled === false ||
                  !projectRoleOptions.length ||
                  isSavingSettings
                }
                onChange={handleProjectRoleChange}
              >
                {projectRoleOptions.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </Box>
          </FormControl>
        </Box>
      </Stack>

      <AddDomainModal
        isOpen={isOpen}
        onClose={handleClose}
        workspaceId={workspaceId}
      />
    </>
  );
};

export default WorkspaceDomain;
