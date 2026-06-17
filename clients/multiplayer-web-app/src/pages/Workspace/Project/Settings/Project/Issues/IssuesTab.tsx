import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import {
  IssueCategoryEnum,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import { Checkbox, Spinner, Stack } from "@chakra-ui/react";
import Content from "pages/Workspace/Project/Settings/SettingsLayout/Content";
import LabelGroup from "shared/components/LabelGroup";
import useMessage from "shared/hooks/useMessage";
import { usePermissions } from "shared/providers/PermissionsContext";
import {
  getGlobalIssuesSettings,
  updateGlobalIssuesSettings,
} from "shared/services/radar.service";

import IssueSettingsSection from "./IssueSettingsSection";
import { useProjectSettings } from "../ProjectSettingsContext";

type IssueCategoryOption = {
  label: string;
  value: string;
};

const ISSUE_CATEGORY_LABELS: Record<IssueCategoryEnum, string> = {
  [IssueCategoryEnum.ERROR]: "Error",
  [IssueCategoryEnum.EXCEPTION]: "Exception",
  [IssueCategoryEnum.FEEDBACK]: "Feedback",
  [IssueCategoryEnum.OUTAGE]: "Outage",
  [IssueCategoryEnum.METRIC]: "Metric",
  [IssueCategoryEnum.DB_QUERY]: "Database Query",
  [IssueCategoryEnum.HTTP_CLIENT]: "HTTP Client",
  [IssueCategoryEnum.FRONTEND]: "Frontend",
  [IssueCategoryEnum.MOBILE]: "Mobile",
};

const ISSUE_CATEGORY_OPTIONS: IssueCategoryOption[] = Object.values(
  IssueCategoryEnum
).map((category) => ({
  label: ISSUE_CATEGORY_LABELS[category],
  value: category,
}));

const IssuesTab = () => {
  const { workspaceId, projectId, project, onUpdate } = useProjectSettings();
  const message = useMessage();
  const { hasAccess } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<IssueCategoryOption[]>([]);

  const canUpdate = useMemo(
    () =>
      hasAccess(
        RoleProjectPermissionEntity.ISSUE_SETTINGS,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
    [hasAccess]
  );

  const canRead = useMemo(
    () =>
      hasAccess(
        RoleProjectPermissionEntity.ISSUE_SETTINGS,
        RoleAccessAction.READ,
        RoleType.PROJECT
      ),
    [hasAccess]
  );

  useEffect(() => {
    const fetchSettings = async () => {
      if (!workspaceId || !projectId || !canRead) {
        setLoading(false);
        return;
      }

      try {
        const settings = await getGlobalIssuesSettings(workspaceId, projectId);
        const selectedCategories = settings?.createOnlyForCategories || [];
        const initialSelection = ISSUE_CATEGORY_OPTIONS.filter((opt) =>
          selectedCategories.includes(opt.value)
        );
        setSelection(initialSelection);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [workspaceId, projectId, canRead, message]);

  const handleToggleCategory = debounce(async (option: IssueCategoryOption) => {
    if (!workspaceId || !projectId || !canUpdate) return;

    const nextSelection = selection.some((opt) => opt.value === option.value)
      ? selection.filter((opt) => opt.value !== option.value)
      : [...selection, option];

    setSelection(nextSelection);

    try {
      await updateGlobalIssuesSettings(workspaceId, projectId, {
        createOnlyForCategories: nextSelection.map((opt) => opt.value),
      });
      message.success("Issues settings updated successfully");
    } catch (error) {
      setSelection(selection);
      message.handleError(error);
    }
  }, 200);

  return (
    <Content title="Issues">
      <Stack spacing="0" gap={{ base: "6", md: "10" }}>
        {canRead ? (
          <Stack gap="4">
            <LabelGroup label="Auto-create issues for these categories:" />
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <Stack spacing={2}>
                {ISSUE_CATEGORY_OPTIONS.map((option) => (
                  <Checkbox
                    size="sm"
                    key={option.value}
                    isChecked={selection.some(
                      (selected) => selected.value === option.value
                    )}
                    onChange={() => handleToggleCategory(option)}
                    isDisabled={!canUpdate}
                  >
                    {option.label}
                  </Checkbox>
                ))}
              </Stack>
            )}
          </Stack>
        ) : null}
        <IssueSettingsSection
          workspaceId={workspaceId}
          projectId={projectId}
          project={project}
          onUpdate={onUpdate}
        />
      </Stack>
    </Content>
  );
};

export default IssuesTab;
