import {
  RoleAccessAction,
  IProject,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import {
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
} from "@chakra-ui/react";
import * as WorkspaceService from "shared/services/workspace.service";
import LabelGroup from "shared/components/LabelGroup";
import CheckAccess from "shared/components/CheckAccess";
import useMessage from "shared/hooks/useMessage";

interface Props {
  workspaceId: string;
  projectId: string;
  project: IProject;
  onUpdate: () => Promise<void>;
}

const IssueSettingsSection = ({
  workspaceId,
  projectId,
  project,
  onUpdate,
}: Props) => {
  const message = useMessage();

  const updateProjectSettings = async (settings: Partial<IProject>) => {
    try {
      await WorkspaceService.updateProject(workspaceId, projectId, settings);

      await onUpdate();
      message.success("Project settings updated successfully");
    } catch (error) {
      message.handleError(error);
    }
  };

  const onFixabilityChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === "") {
      return;
    }

    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const parsed = Math.max(0, Math.min(100, n));
    if (
      parsed === (project.settings?.agent?.fixabilityScoreThreshold ?? null)
    ) {
      return;
    }

    await updateProjectSettings({
      settings: {
        ...project.settings,
        agent: {
          ...project.settings?.agent,
          fixabilityScoreThreshold: parsed,
        },
      },
    });
  };

  return (
    <CheckAccess
      permission={RoleAccessAction.UPDATE}
      entity={RoleWorkspacePermissionEntity.PROJECT}
    >
      <Stack spacing="0" gap={{ base: "6", md: "10" }}>
        <Flex gap="2" alignItems="center" justifyContent="space-between">
          <LabelGroup
            label="Automate issue resolution"
            description="Automatically resolve issues based on the project's rules."
          />
        </Flex>
        <Flex gap="2" alignItems="center" justifyContent="space-between">
          <LabelGroup
            label="Fixability score threshold"
            description="Minimum fixability score (0-100) required before an issue is auto-resolved."
          />
          <NumberInput
            w="100px"
            min={0}
            max={100}
            defaultValue={
              project.settings?.agent?.fixabilityScoreThreshold ?? 70
            }
            onBlur={onFixabilityChange}
          >
            <NumberInputField min={0} max={100} />
            <NumberInputStepper sx={{ svg: { boxSize: "1em" } }}>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Flex>
      </Stack>
    </CheckAccess>
  );
};

export default IssueSettingsSection;
