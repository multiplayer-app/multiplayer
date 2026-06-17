import {
  Box,
  Button,
  Flex,
  FormControl,
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
import { IntegrationTypeEnum } from "@multiplayer/types";
import { useAlertRules } from "shared/providers/AlertRulesContext";
import useMessage from "shared/hooks/useMessage";
import { Controller, useForm } from "react-hook-form";
import CreatableSelect from "shared/components/CreatableSelect";
import { yupResolver } from "@hookform/resolvers/yup";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { testAlertRuleAction } from "shared/services/radar.service";
import { ENVIRONMENT_OPTIONS, CONDITION_LABELS } from "../alertRules.constants";
import {
  createEmptyRule,
  mapRuleToForm,
  buildPayload,
} from "../alertRules.utils";
import { alertRuleSchema } from "../alertRules.schema";
import { RuleFormState } from "../alertRules.types";

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

  const watchedName = watch("name");
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
      const { _id, ...action } = actions[0] as any;
      await testAlertRuleAction(workspaceId, projectId, ruleId, action);
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
          onClick={rhfHandleSubmit(onSubmit)}
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
