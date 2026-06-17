import { Flex, Stack, Switch } from "@chakra-ui/react";
import { OtelAgentSelectionMode } from "@multiplayer/types";
import LabelGroup from "shared/components/LabelGroup";
import SelectDropdown from "shared/components/SelectDropdown";

export const OTEL_AGENT_SELECTION_LABELS: Record<
  OtelAgentSelectionMode,
  string
> = {
  [OtelAgentSelectionMode.ANY]: "Any agent",
  [OtelAgentSelectionMode.ONLY_MY_AGENT]: "Only my agent",
};

export type OtelKeySettingsValues = {
  agentSelectionMode: OtelAgentSelectionMode;
  autoResolveIssues: boolean;
  autoCreateIssues: boolean;
};

export const defaultOtelKeySettings = (): OtelKeySettingsValues => ({
  agentSelectionMode: OtelAgentSelectionMode.ANY,
  autoResolveIssues: true,
  autoCreateIssues: true,
});

export const otelKeySettingsFromIntegration = (raw?: {
  otel?: {
    agentSelectionMode?: OtelAgentSelectionMode;
    autoResolveIssues?: boolean;
    autoCreateIssues?: boolean;
  };
}): OtelKeySettingsValues => ({
  agentSelectionMode:
    raw?.otel?.agentSelectionMode ?? OtelAgentSelectionMode.ANY,
  autoResolveIssues: raw?.otel?.autoResolveIssues !== false,
  autoCreateIssues: raw?.otel?.autoCreateIssues !== false,
});

interface OtelKeySettingsFieldsProps {
  values: OtelKeySettingsValues;
  disabled?: boolean;
  agentSelectionOptions: { value: string; label: string }[];
  onAgentSelectionModeChange: (mode: OtelAgentSelectionMode) => void;
  onAutoResolveIssuesChange: (value: boolean) => void;
  onAutoCreateIssuesChange: (value: boolean) => void;
}

const OtelKeySettingsFields = ({
  values,
  disabled,
  agentSelectionOptions,
  onAgentSelectionModeChange,
  onAutoResolveIssuesChange,
  onAutoCreateIssuesChange,
}: OtelKeySettingsFieldsProps) => (
  <Stack spacing="3" pb="3" maxW="640px">
    <Flex gap="2" alignItems="center" justifyContent="space-between">
      <LabelGroup
        gap="0"
        label="Agent scope"
        description="Which debugging agents can use sessions from this key."
      />
      <SelectDropdown
        value={values.agentSelectionMode}
        options={agentSelectionOptions}
        onChange={(opt) =>
          onAgentSelectionModeChange(opt.value as OtelAgentSelectionMode)
        }
        buttonProps={{ disabled, h: "8", minW: "160px", px: "3" }}
      />
    </Flex>
    <Flex gap="2" alignItems="center" justifyContent="space-between">
      <LabelGroup
        gap="0"
        label="Automate issue creation"
        description="Create issues from session recorder errors for this key."
      />
      <Switch
        colorScheme="brand"
        isDisabled={disabled}
        isChecked={values.autoCreateIssues}
        onChange={(e) => onAutoCreateIssuesChange(e.target.checked)}
      />
    </Flex>
    <Flex gap="2" alignItems="center" justifyContent="space-between">
      <LabelGroup
        gap="0"
        label="Automate issue resolution"
        description="Allow agents to auto-resolve issues recorded with this key."
      />
      <Switch
        colorScheme="brand"
        isDisabled={disabled}
        isChecked={values.autoResolveIssues}
        onChange={(e) => onAutoResolveIssuesChange(e.target.checked)}
      />
    </Flex>
  </Stack>
);

export default OtelKeySettingsFields;
