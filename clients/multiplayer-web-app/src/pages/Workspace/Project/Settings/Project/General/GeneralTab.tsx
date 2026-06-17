import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { Avatar, Box, Button, Flex, Stack } from "@chakra-ui/react";
import Content from "pages/Workspace/Project/Settings/SettingsLayout/Content";
import CheckAccess from "shared/components/CheckAccess";
import FileInput from "shared/components/FileInput";
import FormField from "shared/components/FormField";
import LabelGroup from "shared/components/LabelGroup";
import useMessage from "shared/hooks/useMessage";
import * as WorkspaceService from "shared/services/workspace.service";

import { useProjectSettings } from "../ProjectSettingsContext";

const schema = yup
  .object({ name: yup.string().trim().required("This field is required") })
  .required();

const GeneralTab = () => {
  const { workspaceId, projectId, project, onUpdate } = useProjectSettings();
  const message = useMessage();
  const { register, formState } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: { name: project.name },
  });

  const handleNameChange = async (e) => {
    const { name, value } = e.target as { name: "name"; value: string };
    const valueTrim = value.trim();
    if (formState.errors[name] || project[name] === valueTrim) return;
    try {
      await WorkspaceService.updateProject(workspaceId, projectId, {
        name: valueTrim,
      });
      await onUpdate();
      message.success("Project name was changed.");
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleIconChange = async (file: Blob) => {
    try {
      await WorkspaceService.updateProjectIcon(workspaceId, projectId, file);
      await onUpdate();
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleCoverImageChange = async (file: Blob) => {
    try {
      await WorkspaceService.updateProjectCover(workspaceId, projectId, file);
      await onUpdate();
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Content title="General">
      <Stack spacing="0" gap={{ base: "5", md: "6" }}>
        <CheckAccess
          entity={RoleWorkspacePermissionEntity.WORKSPACE_MEMBER}
          permission={RoleAccessAction.UPDATE}
        >
          <FormField
            maxW="400px"
            name="name"
            label="Project name"
            placeholder="Enter project name"
            defaultValue={project.name}
            onBlur={handleNameChange}
            registerFn={register}
            errors={formState.errors}
          />
          <Box>
            <LabelGroup
              mb="4"
              label="Project icon"
              description="Pick a project icon to reflect your project. Recommended size is 128 x 128px. Supported formats are JPG, PNG."
            />
            <Flex gap="4">
              <Avatar
                boxSize="10"
                borderRadius="base"
                backgroundColor="bg.muted"
                name={project.name}
                src={project.iconUrl}
              />
              <Button
                w="163px"
                as={FileInput}
                variant="light"
                cursor="pointer"
                onUpload={handleIconChange}
              >
                Upload icon
              </Button>
            </Flex>
          </Box>
          <Box>
            <LabelGroup
              mb="4"
              label="Project cover image"
              description="Pick a project cover image to reflect your project. Supported formats are JPG, PNG."
            />
            <Flex gap="4">
              <Avatar
                boxSize="10"
                borderRadius="base"
                backgroundColor="bg.muted"
                name={project.name}
                src={project.coverImageUrl}
              />
              <Button
                w="163px"
                as={FileInput}
                variant="light"
                cursor="pointer"
                onUpload={handleCoverImageChange}
              >
                Upload cover image
              </Button>
            </Flex>
          </Box>
        </CheckAccess>
      </Stack>
    </Content>
  );
};

export default GeneralTab;
