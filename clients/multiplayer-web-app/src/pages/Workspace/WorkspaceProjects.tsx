import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Flex, Image } from "@chakra-ui/react";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";

import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useAuth } from "shared/providers/AuthContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import {
  buildProjectBasePath,
  DEFAULT_PROJECT_BRANCH_ID,
  DEFAULT_PROJECT_SOURCE_TAB,
  resolveDefaultProjectPath,
} from "shared/navigation/defaultProjectPath";
import PageLoading from "shared/components/PageLoading";
import EmptyScreen from "shared/components/EmptyScreen";
import CreateProject from "shared/components/CreateProject";
import ColorModeToggle from "shared/components/ColorModeToggle";
import HeaderAvatar from "shared/components/HeaderAvatar";
import WorkspaceSwitcher from "shared/components/WorkspaceSwitcher";
import EmptySources from "assets/images/emptyStates/sources-empty-list.png";
import { WorkspaceHeaderBar } from "pages/Workspace/Project/Layout/Header/Header";

const WorkspaceProjects = () => {
  const navigate = useNavigate();
  const { userId, user } = useAuth();
  const { workspaceId } = useParams();
  const { user: workspaceUser } = useWorkspace();
  const { hasAccess } = usePermissions();
  const projects = useMemo(
    () => user.workspaces.find((w) => w._id === workspaceId)?.projects || [],
    [user.workspaces, workspaceId]
  );

  const canCreateProject = useMemo(
    () =>
      hasAccess(RoleWorkspacePermissionEntity.PROJECT, RoleAccessAction.CREATE),
    [hasAccess]
  );

  const handleProjectCreate = useCallback(
    (projectId: string) => {
      const target = `${buildProjectBasePath(
        workspaceId,
        projectId,
        DEFAULT_PROJECT_BRANCH_ID
      )}/${DEFAULT_PROJECT_SOURCE_TAB}`;
      navigate(target);
    },
    [workspaceId, navigate]
  );

  useEffect(() => {
    if (projects.length > 0) {
      const target = resolveDefaultProjectPath(
        userId,
        workspaceId,
        projects,
        false
      );

      if (target) {
        navigate(target, { replace: true });
      }
    }
  }, [projects, userId, workspaceId, navigate]);

  if (projects.length > 0) {
    return <PageLoading />;
  }

  return (
    <Box h="100%">
      <WorkspaceHeaderBar
        left={
          <Flex px="4" minW="0" alignItems="center" h="full">
            <Box w={{ base: "220px", md: "280px" }}>
              <WorkspaceSwitcher size="sm" w="100%" />
            </Box>
          </Flex>
        }
        right={
          <>
            <ColorModeToggle />
            {workspaceUser?.data && (
              <HeaderAvatar size="sm" user={workspaceUser.data} />
            )}
          </>
        }
      />

      <Flex h="calc(100% - 56px)" alignItems="center" justifyContent="center">
        <EmptyScreen
          icon={
            <Image
              src={EmptySources}
              w="180px"
              mb="2"
              opacity="0.9"
              objectFit="contain"
              draggable={false}
            />
          }
          title="This workspace does not have any projects yet"
          description={
            canCreateProject
              ? "Create your first project to start collaborating."
              : "You do not have permission to create projects here. Use the switcher to open another workspace."
          }
        >
          <CreateProject onCreate={handleProjectCreate} />
        </EmptyScreen>
      </Flex>
    </Box>
  );
};

export default WorkspaceProjects;
