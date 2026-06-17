import { memo, useCallback } from "react";
import { Avatar, Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { IUserSession, IUserSessionWorkspace } from "@multiplayer/types";

import { PlusIcon } from "shared/icons";
import Icon from "../Icon";
import { type SessionProject, useSwitcherMenu } from "./menuContext";

type ProjectItemProps = {
  project: SessionProject;
  session: IUserSession;
  workspace: IUserSessionWorkspace;
  isWorkspaceActive: boolean;
};

const menuLikeRowProps = {
  variant: "ghost" as const,
  justifyContent: "flex-start",
  fontWeight: "normal",
  h: "auto",
  minH: 0,
  py: "1",
  px: "2",
  borderRadius: "md",
  w: "full",
  bg: "bg.primary",
  _hover: { bg: "bg.subtle" },
  _active: { bg: "bg.subtle" },
};

const ProjectItem = memo(function ProjectItem({
  project,
  session,
  workspace,
  isWorkspaceActive,
}: ProjectItemProps) {
  const { projectId, activeMenuItemRef, switchToProject } = useSwitcherMenu();

  const isActive = isWorkspaceActive && projectId === project._id;

  const onActivate = useCallback(() => {
    switchToProject(session, workspace, project);
  }, [switchToProject, session, workspace, project]);

  return (
    <Button
      ref={isActive ? activeMenuItemRef : undefined}
      {...menuLikeRowProps}
      onClick={onActivate}
      bg={isActive ? "bg.subtle" : "bg.primary"}
      _hover={{ bg: "bg.subtle" }}
    >
      <Flex align="center" gap="2.5" w="100%" minW="0">
        <Avatar
          size="2xs"
          boxSize="4"
          borderRadius="sm"
          name={project.name}
          src={project.iconUrl}
          flexShrink={0}
        />
        <Text noOfLines={1} flex="1" minW="0" textAlign="left">
          {project.name}
        </Text>
      </Flex>
    </Button>
  );
});

export type WorkspaceRowProps = {
  session: IUserSession;
  workspace: IUserSessionWorkspace;
};

export function WorkspaceRow({ session, workspace }: WorkspaceRowProps) {
  const {
    currentUserId,
    workspaceId,
    projectId,
    workspaceRoles,
    canAddProjectForWorkspace,
    activeMenuItemRef,
    switchWorkspace,
    openCreateProjectModal,
  } = useSwitcherMenu();

  const isWorkspaceActive =
    session._id === currentUserId && workspace._id === workspaceId;
  const projects = workspace.projects ?? [];
  const hasActiveProject =
    isWorkspaceActive &&
    !!projectId &&
    projects.some((p) => p._id === projectId);

  const onSelectWorkspace = useCallback(() => {
    switchWorkspace(session, workspace);
  }, [switchWorkspace, session, workspace]);

  const onAddProject = useCallback(() => {
    openCreateProjectModal(session, workspace);
  }, [openCreateProjectModal, session, workspace]);

  const canAdd = canAddProjectForWorkspace(session, workspace);
  const showProjectTree = projects.length > 0 || canAdd;

  return (
    <Box borderRadius="md" overflow="hidden">
      <Button
        ref={
          isWorkspaceActive && !hasActiveProject ? activeMenuItemRef : undefined
        }
        {...menuLikeRowProps}
        onClick={onSelectWorkspace}
        bg={isWorkspaceActive ? "bg.subtle" : "bg.primary"}
        _hover={{ bg: "bg.subtle" }}
        leftIcon={
          <Avatar
            size="xs"
            boxSize="6"
            name={workspace.name}
            src={workspace.iconUrl}
            borderRadius="sm"
            flexShrink={0}
          />
        }
      >
        <Stack lineHeight="1.25" spacing="0.5" minW="0" align="flex-start">
          <Text noOfLines={1} textAlign="left">
            {workspace.name}
          </Text>
          {workspaceRoles && workspace.user?.role && (
            <Text color="muted" fontSize="xs" noOfLines={1} textAlign="left">
              {workspaceRoles[workspace.user.role]?.name}
            </Text>
          )}
        </Stack>
      </Button>
      {showProjectTree && (
        <Stack
          pl="2"
          ml="2"
          mt="2"
          spacing="0.5"
          borderLeftWidth="1px"
          borderLeftColor="border.secondary"
        >
          {projects.map((project) => (
            <ProjectItem
              key={`${workspace._id}:${project._id}`}
              project={project}
              session={session}
              workspace={workspace}
              isWorkspaceActive={isWorkspaceActive}
            />
          ))}
          {canAdd && (
            <Button
              {...menuLikeRowProps}
              onClick={onAddProject}
              color="muted"
              textAlign="left"
            >
              <Flex
                align="center"
                justifyContent="flex-start"
                gap="2.5"
                w="100%"
                minW="0"
              >
                <Icon as={PlusIcon} boxSize="3.5" flexShrink={0} />
                <Text
                  fontSize="sm"
                  noOfLines={1}
                  flex="1"
                  minW="0"
                  textAlign="left"
                >
                  Add project
                </Text>
              </Flex>
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
