import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FeatureFlag,
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { Avatar, Box, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { AccountUserIcon, AddCircleIcon, WorkspaceIcon } from "shared/icons";

import { useWorkspace } from "shared/providers/WorkspaceContext";
import Icon from "shared/components/Icon";
import NavItem from "shared/components/NavItem";
import CheckAccess from "shared/components/CheckAccess";
import CheckFeature from "shared/components/CheckFeature";
import { workspaceProjectSettingsPath } from "shared/navigation/workspaceSettingsPath";

import "./Sidebar.scss";
import CreateTeamModal from "../../CreateTeamModal";

const Sidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { workspaceId } = useParams();
  const { teams, getTeams, projects } = useWorkspace();
  const settingsRootPath = pathname.split("/settings")[0] + "/settings";

  const handleClose = async (teamId) => {
    onClose();
    if (teamId) {
      await getTeams(workspaceId);
      navigate(`${settingsRootPath}/team/${teamId}`);
    }
  };

  return (
    <Stack
      spacing="2"
      p="2"
      w="220px"
      minW="220px"
      bg="bg.surface"
      overflowY="auto"
      borderRight="1px"
      borderRightColor="border.secondary"
      className="workspace-sidebar custom-scrollbar"
      position={{ base: "fixed", md: "static" }}
      top="56px"
      left="0"
      bottom="0"
    >
      <Stack spacing="0.5">
        <NavItem as={Link} to="general" leftIcon={<Icon as={WorkspaceIcon} />}>
          Workspace
        </NavItem>
        <CheckAccess
          entity={RoleWorkspacePermissionEntity.WORKSPACE}
          permission={RoleAccessAction.UPDATE}
        >
          <NavItem to="general" leftIcon={<Box boxSize="5" />}>
            General
          </NavItem>
        </CheckAccess>
        <NavItem to="members" leftIcon={<Box boxSize="5" />}>
          Members
        </NavItem>
        <CheckAccess
          entity={RoleWorkspacePermissionEntity.WORKSPACE}
          permission={RoleAccessAction.UPDATE}
        >
          <NavItem to="projects" leftIcon={<Box boxSize="5" />}>
            Projects
          </NavItem>
          <NavItem to="integrations" leftIcon={<Box boxSize="5" />}>
            Integrations
          </NavItem>
          <CheckFeature feature={FeatureFlag.ALERT_RULES}>
            <NavItem to="alert-rules" leftIcon={<Box boxSize="5" />}>
              Notifications
            </NavItem>
          </CheckFeature>
          <CheckAccess
            entity={RoleWorkspacePermissionEntity.WORKSPACE}
            permission={RoleAccessAction.BILLING_READ}
          >
            <NavItem to="billing" leftIcon={<Box boxSize="5" />}>
              Billing
            </NavItem>
          </CheckAccess>
        </CheckAccess>
      </Stack>

      <Stack spacing="0.5">
        <NavItem
          as={Link}
          to="profile"
          leftIcon={<Icon as={AccountUserIcon} />}
        >
          Your Account
        </NavItem>
        <NavItem to="profile" leftIcon={<LineBox />}>
          Profile
        </NavItem>

        <NavItem to="linked-accounts" leftIcon={<LineBox />}>
          Linked Accounts
        </NavItem>
      </Stack>

      <Stack spacing="0.5">
        {teams.data.map((team) => (
          <NavItem
            key={team._id}
            to={`${settingsRootPath}/team/${team._id}`}
            whiteSpace="normal"
            leftIcon={
              <Avatar
                size="sm"
                boxSize="5"
                borderRadius="base"
                name={team.name}
                src={team.iconUrl}
              />
            }
          >
            <Text noOfLines={2}>{team.name}</Text>
          </NavItem>
        ))}
        <CheckAccess
          entity={RoleWorkspacePermissionEntity.TEAM}
          permission={RoleAccessAction.CREATE}
        >
          <NavItem
            as={null}
            onClick={onOpen}
            leftIcon={<Icon as={AddCircleIcon} mx="1" />}
          >
            Create a new team
          </NavItem>
        </CheckAccess>
      </Stack>

      <Stack>
        <Text fontSize="xs" fontWeight="semibold" color="muted">
          PROJECTS
        </Text>
        {projects.data?.map((project) => (
          <NavItem
            key={project._id}
            to={workspaceProjectSettingsPath(workspaceId, project._id)}
            whiteSpace="normal"
            leftIcon={
              <Avatar
                size="sm"
                boxSize="5"
                borderRadius="base"
                name={project.name}
                src={project.iconUrl}
              />
            }
          >
            <Text noOfLines={1}>{project.name}</Text>
          </NavItem>
        ))}
      </Stack>

      <CreateTeamModal
        isOpen={isOpen}
        onClose={handleClose}
        workspaceId={workspaceId}
      />
    </Stack>
  );
};

const LineBox = () => {
  return <Box boxSize="5" className="line-box" />;
};

export default Sidebar;
