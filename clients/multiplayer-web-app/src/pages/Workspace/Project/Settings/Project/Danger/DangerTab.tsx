import { useNavigate } from "react-router-dom";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { Box, Button, Stack } from "@chakra-ui/react";
import Content from "pages/Workspace/Project/Settings/SettingsLayout/Content";
import CheckAccess from "shared/components/CheckAccess";
import LabelGroup from "shared/components/LabelGroup";
import useMessage from "shared/hooks/useMessage";
import { PostHogEvents } from "shared/models/enums";
import { workspaceSettingsHref } from "shared/navigation/workspaceSettingsPath";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { useAuth } from "shared/providers/AuthContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import * as WorkspaceService from "shared/services/workspace.service";

import { useProjectSettings } from "../ProjectSettingsContext";

const DangerTab = () => {
  const { workspaceId, projectId } = useProjectSettings();
  const message = useMessage();
  const navigate = useNavigate();
  const { getProjects, projects } = useWorkspace();
  const { updateSessions } = useAuth();
  const { openAlertDialog } = useAlertDialog();
  const { trackEvent } = useAnalytics();

  const handleProjectDelete = async () => {
    try {
      await WorkspaceService.deleteProject(workspaceId, projectId);
      await getProjects(workspaceId);
      await updateSessions();
      navigate(
        workspaceSettingsHref(
          workspaceId,
          "projects",
          projects.data || [],
          false
        )
      );
    } catch (error) {
      message.handleError(error);
    }
  };

  const openConfirmationDialog = async () => {
    const result = await openAlertDialog({ title: "Delete project" });
    if (result) {
      await handleProjectDelete();
      trackEvent(PostHogEvents.DELETE_PROJECT, { projectId });
    }
  };

  return (
    <Content title="Danger zone">
      <Stack spacing="0" gap={{ base: "5", md: "6" }}>
        <CheckAccess
          entity={RoleWorkspacePermissionEntity.PROJECT}
          permission={RoleAccessAction.DELETE}
        >
          <Box>
            <LabelGroup
              mb="4"
              label="Delete project"
              description="Permanently delete this project."
            />
            <Button variant="danger" onClick={openConfirmationDialog}>
              Delete project
            </Button>
          </Box>
        </CheckAccess>
      </Stack>
    </Content>
  );
};

export default DangerTab;
