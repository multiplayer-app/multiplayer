import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Select,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertRuleActionType,
  IntegrationTypeEnum,
  WorkspaceUserStatus,
} from "@multiplayer/types";
import { useAlertRules } from "shared/providers/AlertRulesContext";
import { useWorkspaceUsers } from "shared/providers/WorkspaceContext";
import useMessage from "shared/hooks/useMessage";
import { Controller, FieldErrors, useForm } from "react-hook-form";
import CreatableSelect from "shared/components/CreatableSelect";
import MultiSelect from "shared/components/MultiSelect";
import { yupResolver } from "@hookform/resolvers/yup";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { testAlertRuleAction } from "shared/services/radar.service";
import {
  ENVIRONMENT_OPTIONS,
  CONDITION_LABELS,
  ACTION_TYPE_LABELS,
} from "../alertRules.constants";
import {
  createEmptyRule,
  mapRuleToForm,
  buildPayload,
  buildActionPayload,
} from "../alertRules.utils";
import { alertRuleSchema } from "../alertRules.schema";
import { RuleFormState } from "../alertRules.types";

// First validation message in a nested react-hook-form errors object. `ref` holds the
// field's DOM element and is never descended into.
const firstErrorMessage = (
  errors: FieldErrors | undefined,
): string | undefined => {
  for (const [key, error] of Object.entries(errors || {})) {
    if (key === "ref" || !error || typeof error !== "object") continue;
    if (typeof error.message === "string") return error.message;
    const nested = firstErrorMessage(error as FieldErrors);
    if (nested) return nested;
  }
  return undefined;
};

interface AlertRuleProps {
  mode: "create" | "edit";
  ruleId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const AlertRule = ({ mode, ruleId, onClose, onSaved }: AlertRuleProps) => {
  const { workspaceId } = useParams();
  const message = useMessage();
  const {
    createAlertRule,
    updateAlertRule,
    getAlertRule,
    projectId,
    setProjectId,
  } = useAlertRules();
  const { projects, integrations } = useIntegrations();
  const workspaceUsers = useWorkspaceUsers();
  const [loading, setLoading] = useState(mode !== "create");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectId ?? "",
  );

  const {
    control,
    register,
    watch,
    handleSubmit: rhfHandleSubmit,
    reset,
  } = useForm<RuleFormState>({
    resolver: yupResolver(alertRuleSchema),
    defaultValues: createEmptyRule(),
  });

  const slackIntegration = useMemo(() => {
    const slackList = integrations.get(IntegrationTypeEnum.SLACK);
    return slackList?.length ? slackList[0] : null;
  }, [integrations]);

  const slackTeamName = useMemo(() => {
    return (slackIntegration as any)?.slack?.teamName || "";
  }, [slackIntegration]);

  useEffect(() => {
    if (mode === "create") {
      const empty = createEmptyRule(slackIntegration);
      reset(empty);
      setLoading(false);
      return;
    }

    if (!ruleId) {
      message.handleError({ message: "Notification rule id is missing." });
      setLoading(false);
      return;
    }

    const fetchRule = async () => {
      try {
        setLoading(true);
        const rule = await getAlertRule(ruleId);
        const mapped = mapRuleToForm(rule, slackIntegration);
        reset(mapped);
      } catch (err) {
        message.handleError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRule();
  }, [mode, ruleId, getAlertRule, slackIntegration]);

  useEffect(() => {
    setSelectedProjectId(projectId ?? "");
  }, [projectId]);

  const memberOptions = useMemo(
    () =>
      Object.values(workspaceUsers)
        .filter((member) => member.status === WorkspaceUserStatus.ACTIVE)
        .map((member) => {
          const name =
            [member.firstName, member.lastName].filter(Boolean).join(" ") ||
            member.username;
          return {
            label: member.primaryEmail ? `${name} (${member.primaryEmail})` : name,
            value: member._id,
          };
        }),
    [workspaceUsers],
  );

  const watchedName = watch("name");
  const actionType = watch("actions.0.type");
  const hasWebhookSecret = watch("actions.0.webhook.hasSecret");
  const hasTeamsWebhookUrl = watch("actions.0.teams.hasWebhookUrl");
  const hasSlackWebhookUrl = watch("actions.0.slackWebhook.hasWebhookUrl");
  const canSubmit = !!projectId && !!watchedName?.trim() && !saving;

  const onSubmit = async (values: RuleFormState) => {
    if (!canSubmit) return;
    try {
      setSaving(true);
      const payload = buildPayload(values);
      if (mode === "create") {
        await createAlertRule(payload);
      } else if (ruleId) {
        await updateAlertRule(ruleId, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      message.handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = (errors: FieldErrors<RuleFormState>) => {
    message.handleError({
      message: firstErrorMessage(errors) || "Please check the notification rule",
    });
  };

  const handleTestNotification = async () => {
    if (!workspaceId || !projectId || !ruleId) return;

    const actions = watch("actions");
    if (!actions || actions.length === 0) {
      message.handleError({
        message: "Please add at least one action to test",
      });
      return;
    }

    try {
      setTesting(true);
      await testAlertRuleAction(
        workspaceId,
        projectId,
        ruleId,
        buildActionPayload(actions[0]),
      );
      message.success("Test notification sent successfully!");
    } catch (err) {
      message.handleError(err);
    } finally {
      setTesting(false);
    }
  };

  const panelTitle =
    mode === "create" ? "Create notification rule" : "Edit notification rule";

  return (
    <Flex direction="column" h="full">
      <Flex
        px={6}
        py={4}
        borderBottom="1px solid"
        borderBottomColor="border.primary"
        alignItems="center"
        flexShrink={0}
      >
        <Heading as="h3" size="sm">
          {panelTitle}
        </Heading>
      </Flex>

      <Box flex="1" overflow="auto" px={6} py={4}>
        {loading ? (
          <Flex justifyContent="center" py={20}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <Stack spacing={5}>
            <FormControl>
              <FormLabel fontSize="sm">Notification name</FormLabel>
              <Input
                size="sm"
                placeholder="e.g. Prod issue alerts"
                {...register("name")}
              />
            </FormControl>

            <Grid
              gap={3}
              templateColumns={{
                base: "repeat(1, 1fr)",
                md: "repeat(2, 1fr)",
              }}
            >
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm">Project</FormLabel>
                  <Select
                    size="sm"
                    placeholder={
                      projects.length ? "Select project" : "No projects found"
                    }
                    value={selectedProjectId}
                    onChange={(e) => {
                      const next = e.target.value || undefined;
                      setSelectedProjectId(e.target.value);
                      setProjectId(next);
                    }}
                    isDisabled={projects.length === 0}
                  >
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm">Environment</FormLabel>
                  <Controller
                    name="environmentName"
                    control={control}
                    render={({ field }) => (
                      <CreatableSelect
                        options={ENVIRONMENT_OPTIONS}
                        value={
                          field.value
                            ? { label: field.value, value: field.value }
                            : null
                        }
                        onChange={(newValue) =>
                          field.onChange(newValue?.value || "")
                        }
                        placeholder="Select or type environment"
                      />
                    )}
                  />
                </FormControl>
              </GridItem>
            </Grid>

            <FormControl>
              <FormLabel fontSize="sm">Condition</FormLabel>
              <Select
                size="sm"
                placeholder="Select condition"
                {...register("conditions.0.type")}
              >
                {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Notify via</FormLabel>
              <Select size="sm" {...register("actions.0.type")}>
                {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                    disabled={
                      value === AlertRuleActionType.SEND_SLACK_NOTIFICATION &&
                      !slackIntegration &&
                      actionType !== value
                    }
                  >
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {actionType === AlertRuleActionType.SEND_SLACK_NOTIFICATION && (
              <>
                <FormControl>
                  <FormLabel fontSize="sm">Slack Workspace</FormLabel>
                  <Input
                    size="sm"
                    value={slackTeamName}
                    isReadOnly
                    bg="bg.subtle"
                    cursor="default"
                    _focus={{ boxShadow: "none" }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Channel</FormLabel>
                  <Flex gap={2} alignItems="center">
                    <Input
                      size="sm"
                      placeholder="Channel ID"
                      {...register("actions.0.slack.channelId")}
                    />
                    <Text fontSize="sm" color="muted" flexShrink={0}>
                      or
                    </Text>
                    <Input
                      size="sm"
                      placeholder="Channel Name"
                      {...register("actions.0.slack.channelName")}
                    />
                  </Flex>
                </FormControl>
              </>
            )}

            {actionType === AlertRuleActionType.SEND_EMAIL_NOTIFICATION && (
              <FormControl>
                <FormLabel fontSize="sm">Recipients</FormLabel>
                <Controller
                  name="actions.0.email.workspaceUsers"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      // MultiSelect reads its options once; remount when members load
                      key={memberOptions.length}
                      searchable
                      options={memberOptions}
                      selection={memberOptions.filter((option) =>
                        (field.value || []).includes(option.value),
                      )}
                      setSelection={(selection) =>
                        field.onChange(selection.map(({ value }) => value))
                      }
                      placeholder="Select workspace members"
                    />
                  )}
                />
                <FormHelperText fontSize="xs">
                  Active workspace members receive the alert at their primary
                  email address.
                </FormHelperText>
              </FormControl>
            )}

            {actionType === AlertRuleActionType.SEND_WEBHOOK_NOTIFICATION && (
              <>
                <FormControl>
                  <FormLabel fontSize="sm">Webhook URL</FormLabel>
                  <Input
                    size="sm"
                    placeholder="https://example.com/multiplayer-alerts"
                    {...register("actions.0.webhook.url")}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Signing secret</FormLabel>
                  <Input
                    size="sm"
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      hasWebhookSecret
                        ? "Configured - leave empty to keep it"
                        : "Optional, 16 characters or more"
                    }
                    {...register("actions.0.webhook.secret")}
                  />
                  <FormHelperText fontSize="xs">
                    Deliveries are signed: X-Multiplayer-Signature is
                    &quot;sha256=&quot; + HMAC-SHA256(secret,
                    X-Multiplayer-Timestamp + &quot;.&quot; + body).
                  </FormHelperText>
                </FormControl>
              </>
            )}

            {actionType ===
              AlertRuleActionType.SEND_SLACK_WEBHOOK_NOTIFICATION && (
              <FormControl>
                <FormLabel fontSize="sm">Slack webhook URL</FormLabel>
                <Input
                  size="sm"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    hasSlackWebhookUrl
                      ? "Configured - leave empty to keep it"
                      : "https://hooks.slack.com/services/..."
                  }
                  {...register("actions.0.slackWebhook.webhookUrl")}
                />
                <FormHelperText fontSize="xs">
                  Create an incoming webhook for the channel in your Slack app
                  settings (Incoming Webhooks) and paste its URL. No Slack
                  integration is needed.
                </FormHelperText>
              </FormControl>
            )}

            {actionType === AlertRuleActionType.SEND_TEAMS_NOTIFICATION && (
              <FormControl>
                <FormLabel fontSize="sm">Teams Workflows webhook URL</FormLabel>
                <Input
                  size="sm"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    hasTeamsWebhookUrl
                      ? "Configured - leave empty to keep it"
                      : "https://...logic.azure.com/workflows/..."
                  }
                  {...register("actions.0.teams.webhookUrl")}
                />
                <FormHelperText fontSize="xs">
                  In the Teams channel, add the &quot;Post to a channel when a
                  webhook request is received&quot; workflow and paste its URL.
                </FormHelperText>
              </FormControl>
            )}
          </Stack>
        )}
      </Box>

      <Flex
        gap={2}
        px={6}
        py={4}
        borderTop="1px solid"
        borderTopColor="border.primary"
        justifyContent="flex-end"
        flexShrink={0}
      >
        <Button variant="outline" onClick={onClose} isDisabled={saving}>
          Cancel
        </Button>
        {ruleId && (
          <Button
            variant="outline"
            onClick={handleTestNotification}
            isLoading={testing}
            isDisabled={!projectId || testing}
          >
            Send Test Notification
          </Button>
        )}
        <Button
          colorScheme="blue"
          onClick={rhfHandleSubmit(onSubmit, onInvalid)}
          isDisabled={!canSubmit}
          isLoading={saving}
        >
          {mode === "create" ? "Create rule" : "Save rule"}
        </Button>
      </Flex>
    </Flex>
  );
};

export default AlertRule;
