import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { SendInviteIcon } from "shared/icons";
import {
  RoleAccessAction,
  RoleType,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import {
  Box,
  Button,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";

import useMessage from "shared/hooks/useMessage";
import { IListRes, IMember } from "shared/models/interfaces";

import * as WorkspaceService from "shared/services/workspace.service";

import { PostHogEvents } from "shared/models/enums";
import LabelGroup from "shared/components/LabelGroup";
import { useAuth } from "shared/providers/AuthContext";
import MembersTable from "shared/components/MembersTable";
import InviteMembers from "shared/components/InviteMembers";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import CheckAccess from "shared/components/CheckAccess";
import { setLastWorkspaceId } from "shared/storage/workspaceStorage";

const WorkspaceMembers = () => {
  const message = useMessage();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { trackEvent } = useAnalytics();
  const { getProjects } = useWorkspace();
  const { workspaceRoles } = usePermissions();
  const { sessions, updateSessions, user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [members, setMembers] = useState<IListRes<IMember>>(null);

  const getData = useCallback(async () => {
    try {
      const membersRes = await WorkspaceService.getWorkspaceUsers(workspaceId);
      setMembers(membersRes);
    } catch (error) {
      message.handleError(error);
      navigate("general", { replace: true });
    }
  }, [workspaceId, message, navigate]);

  useEffect(() => {
    getData();
  }, [getData]);

  const handleSubmit = async ({ email, teams, role }) => {
    const emails = email
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      await WorkspaceService.inviteWorkspaceMembers(workspaceId, {
        emails,
        teams: teams?.map((i) => i.value),
        role,
      });

      trackEvent(PostHogEvents.INVITE_USERS, {
        emails,
        role: workspaceRoles && workspaceRoles[role]?.name,
        teams: teams?.map((i) => i.label),
        actionSource: "Settings -> Workspace -> Members",
      });

      onClose();
      await getData();
    } catch (error) {
      message.handleError(error);
    }
  };

  const cleanupSessions = (userId) => {
    if (
      sessions.some(({ workspaces }) =>
        workspaces.some(({ user }) => user._id === userId)
      )
    ) {
      updateSessions();
    }
  };

  const handleRemoveMember = async (
    userId: string,
    isCurrentUsersLastWorkspace: boolean
  ) => {
    try {
      await WorkspaceService.deleteWorkspaceMembers(workspaceId, userId);

      trackEvent(PostHogEvents.DELETE_WORKSPACE_MEMBER, {
        deletedUserId: userId,
        actionSource: "Settings -> Workspace -> Members table",
      });

      cleanupSessions(userId);
      await getProjects(workspaceId);

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
      updateSessions();

      trackEvent(PostHogEvents.LEAVE_WORKSPACE, {
        leftUserId: user._id,
        actionSource: "Settings -> Workspace -> Members table",
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
      await WorkspaceService.updateWorkspaceMembers(workspaceId, userId, {
        role,
      });
      await getData();
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

  return (
    <Box>
      <CheckAccess
        entity={RoleWorkspacePermissionEntity.WORKSPACE_MEMBER}
        permission={RoleAccessAction.CREATE}
      >
        <LabelGroup
          mb="4"
          label="Manage members"
          description="Manage your current members, or invite new ones."
        />
        <Button
          mb="8"
          type="submit"
          leftIcon={<SendInviteIcon />}
          onClick={onOpen}
        >
          Invite people
        </Button>
      </CheckAccess>

      <MembersTable
        type={RoleType.WORKSPACE}
        data={members?.data || []}
        onRemove={handleRemoveMember}
        onLeave={handleLeaveWorkspace}
        onResend={handleResendInvitation}
        onRoleUpdate={handleUserRoleUpdate}
      />
      <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent flexDirection={{ base: "column-reverse", md: "row" }} mt={{ base: 8, md: 16 }}>
          <ModalCloseButton color="muted" zIndex="2" />
          <InviteMembers onSubmit={handleSubmit} />
        </ModalContent>
      </Modal>
    </Box>
  );
};
export default WorkspaceMembers;
