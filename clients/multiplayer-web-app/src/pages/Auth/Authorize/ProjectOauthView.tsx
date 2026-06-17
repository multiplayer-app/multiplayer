import { useEffect, useState } from "react";
import { Box, Button, Link, Select, Stack, Text } from "@chakra-ui/react";
import {
  IOauthClient,
  OauthTokenType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import { getWorkspaceProjects } from "shared/services/workspace.service";
import useMessage from "shared/hooks/useMessage";
import { useAuth } from "shared/providers/AuthContext";
import { generateAuthCode } from "shared/services/auth.service";
import { useLocation } from "react-router-dom";

interface ProjectOauthViewProps {
  clientInfo: Partial<IOauthClient>;
  onAuthorize: (code: string | undefined, err?: any) => void;
}

const ProjectOauthView = ({
  clientInfo,
  onAuthorize,
}: ProjectOauthViewProps) => {
  const message = useMessage();
  const { user } = useAuth();
  const location = useLocation();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  const scope = {
    [RoleProjectPermissionEntity.DEBUG_SESSION]: [RoleAccessAction.READ],
    [RoleProjectPermissionEntity.SESSION_NOTES]: [RoleAccessAction.READ],
  };

  // Initialize workspaces from user data
  useEffect(() => {
    if (user?.workspaces) {
      setWorkspaces(user.workspaces);
      if (user.workspaces.length > 0) {
        const firstWorkspaceId = user.workspaces[0]._id;
        setSelectedWorkspace(firstWorkspaceId);
      }
    }
  }, [user]);

  // Fetch projects when workspace changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (selectedWorkspace) {
        try {
          const projectsData = await getWorkspaceProjects(selectedWorkspace);
          setProjects(projectsData.data);
          if (projectsData.data.length > 0) {
            const firstProjectId = projectsData.data[0]._id;
            setSelectedProject(firstProjectId);
          }
        } catch (err) {
          message.handleError(err);
        }
      }
    };
    fetchProjects();
  }, [selectedWorkspace, message]);

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const workspaceId = e.target.value;
    setSelectedWorkspace(workspaceId);
    setProjects([]);
    setSelectedProject("");
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
  };

  const handleAuthorize = async () => {
    try {
      const query = new URLSearchParams(location.search);
      const codeChallenge = query.get("code_challenge");
      const clientId = query.get("client_id");
      const redirectUri = query.get("redirect_uri");
      const codeChallengeMethod = query.get("code_challenge_method");
      const state = query.get("state");

      try {
        const code = await generateAuthCode(clientId, {
          codeChallenge,
          codeChallengeMethod,
          redirectUri,
          scope,
          workspaceId: selectedWorkspace,
          projectId: selectedProject,
          tokenType: OauthTokenType.PROJECT,
        });

        onAuthorize(code);
      } catch (err) {
        onAuthorize(undefined, err);
      }
    } catch (error) {
      message.handleError(error);
      onAuthorize(undefined, error);
    }
  };

  return (
    <>
      <Stack spacing={4} alignItems="center">
        {/* {clientInfo?.logoUri && (
          <Box display="flex" justifyContent="center">
            <img src={clientInfo.logoUri} alt={`${clientInfo?.clientName} logo`} style={{ maxHeight: '80px', maxWidth: '200px' }} />
          </Box>
        )} */}

        <Text color="muted" fontSize="sm" textAlign="center">
          Please select the workspace and project where to link the
          <Link
            fontSize="sm"
            color="blue.500"
            href={clientInfo?.clientUri}
            target="_blank"
            rel="noopener noreferrer"
            mr="5px"
            ml="5px"
          >
            {clientInfo?.clientName}
          </Link>
          to.
        </Text>
        <Text color="muted" fontSize="sm" textAlign="center">
          <b>Requested permissions: </b>
          {Object.keys(scope)
            .map(
              (key) => `${key.replaceAll("-", " ")} [${scope[key].join(", ")}]`
            )
            .join(", \n")}
        </Text>
      </Stack>
      <Stack
        spacing={4}
        direction="row"
        width="100%"
        justifyContent="center"
        mb="3"
        mt="3"
      >
        <Box flex={1}>
          <Select value={selectedWorkspace} onChange={handleWorkspaceChange}>
            {workspaces.map((workspace) => (
              <option key={workspace._id} value={workspace._id}>
                {workspace.name}
              </option>
            ))}
          </Select>
        </Box>

        <Box flex={1}>
          <Select value={selectedProject} onChange={handleProjectChange}>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Box>
      </Stack>

      <Stack spacing={4}>
        <Button
          colorScheme="blue"
          onClick={handleAuthorize}
          isDisabled={!selectedWorkspace || !selectedProject}
        >
          Authenticate {clientInfo?.clientName}
        </Button>
      </Stack>
    </>
  );
};

export default ProjectOauthView;
