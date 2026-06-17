import * as yup from "yup";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  ITeam,
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Box, Button, Flex, Heading, Stack } from "@chakra-ui/react";

import FormField from "shared/components/FormField";
import FileInput from "shared/components/FileInput";
import LabelGroup from "shared/components/LabelGroup";
import PageLoading from "shared/components/PageLoading";

import useMessage from "shared/hooks/useMessage";

import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import * as WorkspaceService from "shared/services/workspace.service";

import TeamMembers from "./TeamMembers";
import CheckAccess from "shared/components/CheckAccess";
import { usePermissions } from "shared/providers/PermissionsContext";
import { PostHogEvents } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { Content, NARROW_CONTENT_PROPS } from "../SettingsLayout";

const Team = () => {
  const message = useMessage();
  const navigate = useNavigate();
  const { hasAccess } = usePermissions();
  const { workspaceId, teamId } = useParams();
  const { getTeams } = useWorkspace();
  const { openAlertDialog } = useAlertDialog();
  const { trackEvent } = useAnalytics();

  const [team, setTeam] = useState<ITeam>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isReadonly = !hasAccess(
    RoleWorkspacePermissionEntity.TEAM,
    RoleAccessAction.UPDATE
  );

  const { register, setValue, formState } = useForm({
    mode: "onChange",
    resolver: yupResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const teamRes = await WorkspaceService.getTeam(workspaceId, teamId);
        setValue("name", teamRes.name);
        setTeam(teamRes);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    getData();
  }, [message, setValue, teamId, workspaceId]);

  const handleIconChange = async (file: Blob) => {
    try {
      const res = await WorkspaceService.updateTeamIcon(
        workspaceId,
        teamId,
        file
      );
      setTeam((prev) => ({ ...prev, iconUrl: res.url }));
      await getTeams(workspaceId);
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleNameChange = async (e) => {
    const { name, value } = e.target as { name: "name"; value: string };
    const valueTrim = value.trim();
    if (formState.errors[name] || team[name] === valueTrim) return;
    try {
      await WorkspaceService.updateTeam(workspaceId, teamId, {
        name: valueTrim,
      });
      setTeam((prev) => ({ ...prev, name: valueTrim }));
      await getTeams(workspaceId);
      message.success("Team name was changed.");
    } catch (error) {
      message.handleError(error);
    }
  };

  const openConfirmationDialog = async () => {
    const result = await openAlertDialog({
      title: "Delete team",
    });

    if (result) {
      await handleTeamDelete();
      trackEvent(PostHogEvents.DELETE_TEAM, {
        teamId,
      });
    }
  };

  const handleTeamDelete = async () => {
    try {
      await WorkspaceService.deleteTeam(workspaceId, teamId);
      await getTeams(workspaceId);
      navigate("general");
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Content title="Team Settings" contentProps={NARROW_CONTENT_PROPS}>
      {loading ? (
        <PageLoading />
      ) : team ? (
        <Stack spacing="0" gap="8">
          <CheckAccess
            entity={RoleWorkspacePermissionEntity.TEAM}
            permission={RoleAccessAction.UPDATE}
          >
            <Box>
              <LabelGroup
                mb="4"
                label="Team icon"
                description="Pick a team icon to reflect your team. Recommended size is 256 x 256px. "
              />
              <Flex gap="4">
                <Avatar
                  boxSize="10"
                  borderRadius="base"
                  name={team.name}
                  src={team.iconUrl}
                />
                {!isReadonly && (
                  <Button
                    w="163px"
                    as={FileInput}
                    variant="light"
                    onUpload={handleIconChange}
                  >
                    Change icon
                  </Button>
                )}
              </Flex>
            </Box>
          </CheckAccess>

          <FormField
            maxW="400px"
            name="name"
            label="Team name"
            placeholder="Enter team name"
            isReadOnly={isReadonly}
            onBlur={handleNameChange}
            registerFn={register}
            errors={formState.errors}
          />

          <TeamMembers workspaceId={team.workspace} teamId={team._id} />

          <CheckAccess
            entity={RoleWorkspacePermissionEntity.TEAM}
            permission={RoleAccessAction.DELETE}
          >
            <Box>
              <LabelGroup
                mb="4"
                maxW="560px"
                label="Delete your team"
                description="If you want to permanently delete this team and all of its data, including but not
              limited to members, projects, files, you can do so below."
              />
              <Button variant="danger" onClick={openConfirmationDialog}>
                Delete team
              </Button>
            </Box>
          </CheckAccess>
        </Stack>
      ) : (
        <Heading as="h5" size="md" textAlign="center">
          Team is not found.
        </Heading>
      )}
    </Content>
  );
};

const schema = yup
  .object({
    name: yup.string().required("This field is required"),
  })
  .required();

export default Team;
