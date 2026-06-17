import { useState } from "react";
import { Box, Flex, Button, Avatar } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import FileInput from "shared/components/FileInput";
import LabelGroup from "shared/components/LabelGroup";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useAuth } from "shared/providers/AuthContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import useMessage from "shared/hooks/useMessage";
import * as WorkspaceService from "shared/services/workspace.service";

import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import FormField from "shared/components/FormField";
import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";

const General = () => {
  const { workspace, updateWorkspace, cleanupWorkspace } = useWorkspace();
  const { updateSessions, setSessions } = useAuth();
  const { openAlertDialog } = useAlertDialog();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  const message = useMessage();

  const { register, formState } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: { name: workspace.data.name, handle: workspace.data.handle },
  });

  const [icon, setIcon] = useState(workspace.data.iconUrl);

  const handleIconChange = async (file: Blob) => {
    try {
      const res = await WorkspaceService.updateWorkspaceIcon(
        workspace.data._id,
        file
      );
      setIcon(res.url);
      updateWorkspace({ iconUrl: res.url });
      await updateSessions(); // TODO: Add workspace change handling instead of updating session
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target as {
      name: "name" | "handle";
      value: string;
    };
    const valueTrim = value.trim();
    if (formState.errors[name] || workspace.data[name] === valueTrim) return;
    try {
      const body = {
        name: workspace.data.name,
        handle: workspace.data.handle,
        [name]: value,
      };
      const res = await WorkspaceService.updateWorkspace(
        workspace.data._id,
        body
      );
      updateWorkspace(res);
      await updateSessions();
    } catch (error) {}
  };

  const handleDelete = async () => {
    try {
      await WorkspaceService.deleteWorkspace(workspace?.data?._id);

      trackEvent(PostHogEvents.DELETE_WORKSPACE, {
        workspaceName: workspace?.data?.name,
        workspaceId: workspace?.data?._id,
        actionSource: "Settings -> Workspace -> General",
      });
      cleanupWorkspace();

      setSessions((prev) =>
        prev.map((s) => ({
          ...s,
          workspaces: s.workspaces.filter((w) => w._id !== workspace.data._id),
        }))
      );
      navigate("/", { replace: true });
    } catch (error) {
      message.handleError(error);
    }
  };

  const openConfirmationDialog = async () => {
    const result = await openAlertDialog({
      title: "Delete workspace",
    });

    if (result) {
      await handleDelete();
    }
  };

  return (
    <Content title="General" contentProps={NARROW_CONTENT_PROPS}>
      <Box mb="8">
        <LabelGroup
          mb="4"
          label="Workspace icon"
          description="Pick a workspace icon to reflect your brand. Recommended size is 256 x 256px."
        />
        <Flex gap="4">
          <Avatar
            boxSize="10"
            borderRadius="base"
            name={workspace.data.name}
            src={icon}
          />

          <Button
            w="163px"
            as={FileInput}
            variant="light"
            onUpload={handleIconChange}
          >
            Change icon
          </Button>
        </Flex>
      </Box>

      <FormField
        mb="8"
        maxW="400px"
        name="name"
        label="Workspace name"
        placeholder="Enter workspace name"
        registerFn={register}
        errors={formState.errors}
        onBlur={handleChange}
      />

      <FormField
        mb="8"
        maxW="400px"
        name="handle"
        label="Workspace handle"
        placeholder="Enter workspace handle"
        registerFn={register}
        errors={formState.errors}
        onBlur={handleChange}
      />
      <Box>
        <LabelGroup
          mb="4"
          maxW="560px"
          label="Delete your workspace"
          description="If you want to permanently delete this workspace and all of its data,
          including but not limited to members, projects, files, you can do so
          below."
        />
        <Button variant="danger" onClick={openConfirmationDialog}>
          Delete workspace
        </Button>
      </Box>
    </Content>
  );
};

const schema = yup
  .object({
    name: yup.string().trim().required("This field is required"),
    handle: yup.string().required("This field is required"),
  })
  .required();

export default General;
