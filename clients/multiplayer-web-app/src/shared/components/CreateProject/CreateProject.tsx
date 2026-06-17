import { Icon, Button, useDisclosure } from "@chakra-ui/react";
import { useParams } from "react-router-dom";

import * as WorkspaceService from "shared/services/workspace.service";
import useMessage from "shared/hooks/useMessage";
import { PlusIcon } from "shared/icons";
import { PostHogEvents } from "shared/models/enums";
import ProjectModal from "shared/components/ProjectModal";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import CheckAccess from "shared/components/CheckAccess";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { useAuth } from "shared/providers/AuthContext";

const CreateProject = ({ onCreate }) => {
  const message = useMessage();
  const disclosure = useDisclosure();
  const { trackEvent } = useAnalytics();
  const { getProjects } = useWorkspace();
  const { updateSessions } = useAuth();
  const { user: workspaceUser } = useWorkspace();
  const { workspaceId, teamId } = useParams();

  const handleUpdateProject = async (id: string, iconFile, coverFile) => {
    try {
      const promises = teamId
        ? [WorkspaceService.addProjectToTeam(workspaceId, teamId, id)]
        : [];
      if (iconFile) {
        promises.push(
          WorkspaceService.updateProjectIcon(workspaceId, id, iconFile)
        );
      }
      if (coverFile) {
        promises.push(
          WorkspaceService.updateProjectCover(workspaceId, id, coverFile)
        );
      }
      promises.push(updateSessions());
      await Promise.all(promises);
      await getProjects(workspaceId);
    } catch (error) {
      message.handleError(error);
    }
  };

  const onSubmit = async (values, iconFile, coverFile) => {
    try {
      const res = await WorkspaceService.createProject(workspaceId, {
        name: values.name,
      });

      trackEvent(PostHogEvents.CREATE_PROJECT, {
        projectName: values.name,
        teamId,
        actionSource: "Workspace -> Project modal",
      });

      await handleUpdateProject(res._id, iconFile, coverFile);
      onCreate?.(res._id);
      disclosure.onClose();
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <CheckAccess
      permission={RoleAccessAction.CREATE}
      entity={RoleWorkspacePermissionEntity.PROJECT}
    >
      <Button
        minW="150px"
        rightIcon={<Icon as={PlusIcon} />}
        onClick={disclosure.onOpen}
      >
        Create a project
      </Button>
      <ProjectModal disclosure={disclosure} onSubmit={onSubmit} />
    </CheckAccess>
  );
};

export default CreateProject;
