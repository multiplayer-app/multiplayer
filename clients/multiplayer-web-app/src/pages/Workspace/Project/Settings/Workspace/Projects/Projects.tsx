import { useLocation, useParams } from "react-router-dom";
import { Flex, Text, Avatar } from "@chakra-ui/react";
import CreateProject from "shared/components/CreateProject";

import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useAuth } from "shared/providers/AuthContext";
import TimeAgo from "shared/components/TimeAgo";
import LabelGroup from "shared/components/LabelGroup";
import NavItem from "shared/components/NavItem";
import { GearIcon } from "shared/icons";
import { workspaceProjectSettingsPath } from "shared/navigation/workspaceSettingsPath";
import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";

const Projects = () => {
  const { workspaceId } = useParams();
  const { pathname } = useLocation();
  const { projects, getProjects } = useWorkspace();
  const { updateSessions } = useAuth();
  const isPublicPath = pathname.startsWith("/public/");

  const updateState = async () => {
    await Promise.all([getProjects(workspaceId), updateSessions()]);
  };

  return (
    <Content title="Projects" contentProps={NARROW_CONTENT_PROPS}>
      <Flex justifyContent="space-between" mb={{ base: "4", md: "8" }} gap={2}>
        <LabelGroup
          mb="4"
          label={`Your workspace has ${projects.data.length} projects`}
          description="Projects contain all of the entities and content you use."
        />
        <CreateProject onCreate={updateState} />
      </Flex>
      <Flex direction="column" gap="8">
        {projects.data?.map((project) => (
          <ProjectAccessData
            key={project._id}
            project={project}
            workspaceId={workspaceId}
            isPublicPath={isPublicPath}
          />
        ))}
      </Flex>
    </Content>
  );
};

const ProjectAccessData = ({
  project,
  workspaceId,
  isPublicPath,
}: {
  project: any;
  workspaceId: string;
  isPublicPath: boolean;
}) => {
  const { users } = useWorkspace();

  return (
    <Flex
      p="4"
      gap="3"
      w="100%"
      backgroundColor="bg.subtle"
      border="0.5 solid gray"
      borderRadius="16px"
      direction="column"
    >
      <Flex justifyContent="space-between">
        <Flex alignItems="center" gap="2">
          <Avatar
            size="sm"
            borderRadius="8px"
            src={project.iconUrl}
            name={project.name}
          />
          <Text fontWeight="500" fontSize="14px">
            {project.name}
          </Text>
        </Flex>
        <NavItem
          w="150px"
          variant="light"
          to={workspaceProjectSettingsPath(
            workspaceId,
            project._id,
            undefined,
            isPublicPath
          )}
          leftIcon={<GearIcon />}
        >
          Project settings
        </NavItem>
      </Flex>

      <Text color="muted" fontSize="xs">
        Created <TimeAgo date={project.createdAt} />
      </Text>
      <Text color="muted" fontSize="xs" mt="4">
        Shared with the following teams and members:
      </Text>
      {!project.teams?.length && !project.users?.length ? (
        <Flex color="muted" fontSize="xs" fontStyle="italic">
          This project is not shared with anyone
        </Flex>
      ) : (
        <Flex gap="2">
          {project.teams?.map((team) => (
            <Flex
              key={team._id}
              p="1"
              gap="2"
              borderRadius="8px"
              alignItems="center"
              backgroundColor="bg.primary"
            >
              <Avatar
                size="sm"
                borderRadius="4px"
                src={team.iconUrl}
                name={team.name}
              ></Avatar>
              <Text mr="4" fontSize="sm" fontWeight="500">
                {team.name}
              </Text>
            </Flex>
          ))}
          {project.users?.map((user) => (
            <Flex
              key={user.workspaceUser}
              p="1"
              gap="2"
              borderRadius="8px"
              alignItems="center"
              backgroundColor="bg.primary"
            >
              <WorkspaceUserAvatar
                size="sm"
                key={user.workspaceUser}
                user={user.workspaceUser}
              ></WorkspaceUserAvatar>
              <Text mr="4" fontSize="sm" fontWeight="500">
                {users.data[user.workspaceUser]?.username || "Unknown User"}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
};

export default Projects;
