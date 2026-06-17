import { useCallback, useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { IProject } from "@multiplayer/types";
import { Box, Flex, Heading } from "@chakra-ui/react";
import PageLoading from "shared/components/PageLoading";
import useMessage from "shared/hooks/useMessage";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import * as WorkspaceService from "shared/services/workspace.service";

import { ProjectSettingsContext } from "./ProjectSettingsContext";
import ProjectSettingsNav from "./ProjectSettingsNav";

const Layout = () => {
  const message = useMessage();
  const { getProjects } = useWorkspace();
  const { workspaceId, projectId } = useParams();
  const [project, setProject] = useState<IProject>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    try {
      const data = await WorkspaceService.getProject(workspaceId, projectId);
      setProject(data);
    } catch (error) {
      message.handleError(error);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchProject();
      setLoading(false);
    };
    if (workspaceId && projectId) load();
  }, [fetchProject]);

  const handleUpdate = useCallback(async () => {
    await fetchProject();
    await getProjects(workspaceId);
  }, [fetchProject, getProjects, workspaceId]);

  if (loading) return <PageLoading />;
  if (!project) {
    return (
      <Heading as="h5" size="md" textAlign="center" py="6">
        Project is not found.
      </Heading>
    );
  }

  return (
    <ProjectSettingsContext.Provider
      value={{ workspaceId, projectId, project, onUpdate: handleUpdate }}
    >
      <Flex flex="1" minH="0" direction={{ base: "column", lg: "row" }}>
        <ProjectSettingsNav />
        <Box flex="1" minW="0" overflowY="auto">
          <Outlet />
        </Box>
      </Flex>
    </ProjectSettingsContext.Provider>
  );
};

export default Layout;
