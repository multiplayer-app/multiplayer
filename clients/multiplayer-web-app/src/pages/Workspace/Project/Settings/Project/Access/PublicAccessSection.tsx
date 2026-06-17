import { useMemo } from "react";
import {
  RoleAccessAction,
  IProject,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { Flex, Icon, Switch, Tooltip } from "@chakra-ui/react";
import { WarningTwoIcon } from "@chakra-ui/icons";
import * as WorkspaceService from "shared/services/workspace.service";
import LabelGroup from "shared/components/LabelGroup";
import CopyToClipboard from "shared/components/CopyToClipboard";
import CheckAccess from "shared/components/CheckAccess";
import useMessage from "shared/hooks/useMessage";
import { getNestedProperty } from "shared/utils";

interface Props {
  workspaceId: string;
  projectId: string;
  project: IProject;
  onUpdate: () => Promise<void>;
}

const PublicAccessSection = ({
  workspaceId,
  projectId,
  project,
  onUpdate,
}: Props) => {
  const message = useMessage();

  const isEnabled = useMemo(() => {
    return getNestedProperty(project, "access.guest.enabled", false);
  }, [project]);

  const handleGeneralAccessUpdate = async (enabled: boolean) => {
    try {
      await WorkspaceService.updateProjectAccess(workspaceId, projectId, {
        guest: { enabled },
      });
      await onUpdate();
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <CheckAccess
      entity={RoleWorkspacePermissionEntity.PROJECT}
      permission={RoleAccessAction.UPDATE_ACCESS}
    >
      <Flex gap="2" alignItems="center" justifyContent="space-between">
        <LabelGroup
          label="Public access"
          description="Manage the public access to this project."
        />
        {isEnabled && (
          <>
            <CopyToClipboard
              ml="auto"
              label="Copy project URL"
              value={`${window.location.origin}/public/project/${workspaceId}/${projectId}/default`}
            />
            <Tooltip label="People with the link will be able to view this project.">
              <Icon as={WarningTwoIcon} color="yellow.500" />
            </Tooltip>
          </>
        )}
        <Switch
          colorScheme="brand"
          isChecked={isEnabled}
          onChange={() => handleGeneralAccessUpdate(!isEnabled)}
        />
      </Flex>
    </CheckAccess>
  );
};

export default PublicAccessSection;
