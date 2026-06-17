import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  RoleAccessAction,
  RoleType,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { MoreDotesIcon, SendInviteIcon } from "shared/icons";
import {
  Icon,
  Flex,
  Button,
  FormControl,
  InputRightElement,
} from "@chakra-ui/react";

import useMessage from "shared/hooks/useMessage";
import { useAuth } from "shared/providers/AuthContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import { IListRes, IMember } from "shared/models/interfaces";

import * as yup from "yup";
import * as WorkspaceService from "shared/services/workspace.service";
import { setLastWorkspaceId } from "shared/storage/workspaceStorage";

import FormField from "shared/components/FormField";
import LabelGroup from "shared/components/LabelGroup";
import MembersTable from "shared/components/MembersTable";
import CheckAccess from "shared/components/CheckAccess";

const TeamMembers = ({ workspaceId, teamId, showForm = true }) => {
  const message = useMessage();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { user } = useAuth();
  const [members, setMembers] = useState<IListRes<IMember>>(null);

  const { reset, register, formState, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "" },
  });

  const getData = useCallback(async () => {
    try {
      const membersRes = await WorkspaceService.getTeamMembers(
        workspaceId,
        teamId
      );
      setMembers(membersRes);
    } catch (error) {
      message.handleError(error);
    }
  }, [teamId, workspaceId, message]);

  useEffect(() => {
    getData();
  }, [getData]);

  const onValidSubmit = async ({ email }) => {
    try {
      await WorkspaceService.inviteWorkspaceMembers(workspaceId, {
        emails: [email],
        teams: [teamId],
      });

      trackEvent(PostHogEvents.INVITE_USERS, {
        emails: email,
        teamId: teamId,
        role: "Admin",
        actionSource: "Settings -> Team -> Invite user",
      });

      await getData();
      reset();
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleResendInvitation = async (workspaceMemberId: string) => {
    try {
      await WorkspaceService.resendWorkspaceInvitation(
        workspaceId,
        workspaceMemberId
      );
      message.success("Invitation Resent Successfully!");
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleRemoveMember = async (
    userId: string,
    isCurrentUsersLastWorkspace: boolean
  ) => {
    try {
      await WorkspaceService.deleteTeamMembers(workspaceId, teamId, userId);

      trackEvent(PostHogEvents.DELETE_TEAM_MEMBER, {
        teamId,
        deletedUserId: userId,
        actionSource: "Settings -> Team -> Members table",
      });

      if (isCurrentUsersLastWorkspace) {
        navigate("/dashboard/create-workspace");
      } else {
        await getData();
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleLeaveWorkspace = async (isCurrentUsersLastWorkspace: boolean) => {
    try {
      await WorkspaceService.leaveWorkspace(workspaceId);

      trackEvent(PostHogEvents.LEAVE_WORKSPACE, {
        leftUserId: user._id,
        actionSource: "Settings -> Team -> Members table",
      });

      if (isCurrentUsersLastWorkspace) {
        navigate("/dashboard/create-workspace");
      } else {
        const preservedWorkspace = user.workspaces.find(
          (workspace) => workspace._id !== workspaceId
        );
        setLastWorkspaceId(preservedWorkspace._id);
        navigate("/", { replace: true });
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleUserRoleUpdate = async (userId: string, role: string) => {
    try {
      await WorkspaceService.updateTeamMembers(workspaceId, teamId, userId, {
        role,
      });
      await getData();
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <>
      {showForm && (
        <CheckAccess
          entity={RoleWorkspacePermissionEntity.TEAM}
          permission={RoleAccessAction.CREATE}
        >
          <FormControl as="form" onSubmit={handleSubmit(onValidSubmit)}>
            <LabelGroup
              mb="4"
              label="Manage members"
              description="Manage your current members, or invite new ones."
            />
            <Flex gap="2">
              <FormField
                mb="4"
                name="email"
                registerFn={register}
                errors={formState.errors}
                placeholder="paul@multiplayer.app"
                rightElement={
                  <InputRightElement
                    color="muted"
                    children={<Icon color="muted" as={MoreDotesIcon} />}
                  />
                }
              />
              <Button
                type="submit"
                leftIcon={<SendInviteIcon />}
                isLoading={formState.isSubmitting}
              >
                Send invite
              </Button>
            </Flex>
          </FormControl>
        </CheckAccess>
      )}
      <MembersTable
        type={RoleType.PROJECT}
        data={members?.data || []}
        onRemove={handleRemoveMember}
        onLeave={handleLeaveWorkspace}
        onResend={handleResendInvitation}
        onRoleUpdate={handleUserRoleUpdate}
      />
    </>
  );
};
const schema = yup
  .object({
    email: yup
      .string()
      .email("Please enter valid email address.")
      .required("This field is required"),
  })
  .required();

export default TeamMembers;
