import {
  AlertRuleConditionType,
  AlertRuleFilterType,
  AlertRuleActionType,
  IAlertRule,
  IIntegration,
} from "@multiplayer/types";
import {
  RuleConditionState,
  RuleFilterState,
  RuleActionState,
  RuleFormState,
} from "./alertRules.types";

export const formatScope = (rule: IAlertRule): string => {
  const parts: string[] = [];
  if (rule.scope?.environmentName) {
    parts.push(rule.scope.environmentName);
  }
  if (rule.scope?.componentName) {
    parts.push(rule.scope.componentName);
  }
  return parts?.join(",");
};

export const createCondition = (): RuleConditionState => ({
  type: AlertRuleConditionType.NEW_ISSUE_CREATED,
  interval: "",
  value: undefined,
});

export const createFilter = (): RuleFilterState => ({
  type: AlertRuleFilterType.ISSUE_NEWER_THAN,
  interval: "",
  attribute: "",
  match: undefined,
  value: undefined,
});

export const createAction = (integration?: IIntegration): RuleActionState => ({
  type: integration
    ? AlertRuleActionType.SEND_SLACK_NOTIFICATION
    : AlertRuleActionType.SEND_EMAIL_NOTIFICATION,
  integration: integration?._id || null,
  slack: {
    workspace: integration?.slack?.teamName || "",
    channelId: "",
    channelName: "",
    notes: "",
    tags: "",
  },
  email: { workspaceUsers: [] },
  webhook: { url: "", secret: "" },
  teams: { webhookUrl: "" },
  slackWebhook: { webhookUrl: "" },
});

export const createEmptyRule = (integration?: IIntegration): RuleFormState => ({
  name: "",
  enabled: true,
  environmentName: "",
  componentName: "",
  conditionOperator: "ALL",
  conditions: [createCondition()],
  filterOperator: "NONE",
  filters: [],
  actions: [createAction(integration)],
});

export const mapRuleToForm = (
  rule: IAlertRule,
  integration?: IIntegration,
): RuleFormState => ({
  name: (rule as any).name || "",
  enabled: rule.enabled ?? true,
  environmentName: rule.scope?.environmentName || "",
  componentName: rule.scope?.componentName || "",
  conditionOperator: rule.conditionOperator as "ALL" | "ANY",
  conditions: rule.conditions?.map((condition) => ({
    type: condition.type,
    interval: condition.interval || "",
    value: condition.value || undefined,
  })) ?? [createCondition()],
  filterOperator: rule.filterOperator || "NONE",
  filters: rule.filters?.map((filter) => ({
    type: filter.type,
    interval: filter.interval || "",
    attribute: filter.attribute || "",
    match: filter.match || undefined,
    value: filter.value || undefined,
  })) ?? [createFilter()],
  actions: rule.actions?.map((action) => ({
    _id: (action as { _id?: string })._id,
    type: action.type,
    integration: action.integration || "",
    slack: {
      workspace: integration?.slack?.teamName || "",
      channelId: action.slack?.channelId || "",
      channelName: action.slack?.channelName || "",
      notes: action.slack?.notes || "",
      tags: action.slack?.tags || "",
    },
    email: { workspaceUsers: action.email?.workspaceUsers || [] },
    webhook: {
      url: action.webhook?.url || "",
      secret: "",
      hasSecret: !!action.webhook?.hasSecret,
    },
    teams: {
      webhookUrl: "",
      hasWebhookUrl: !!action.teams?.hasWebhookUrl,
    },
    slackWebhook: {
      webhookUrl: "",
      hasWebhookUrl: !!action.slackWebhook?.hasWebhookUrl,
    },
  })) ?? [createAction(integration)],
});

// Sends only the chosen channel's fields; empty credentials are left out so the stored ones are kept
export const buildActionPayload = (action: RuleActionState) => {
  const base = { ...(action._id && { _id: action._id }), type: action.type };

  switch (action.type) {
    case AlertRuleActionType.SEND_EMAIL_NOTIFICATION:
      return { ...base, email: { workspaceUsers: action.email.workspaceUsers } };

    case AlertRuleActionType.SEND_WEBHOOK_NOTIFICATION:
      return {
        ...base,
        webhook: {
          url: action.webhook.url.trim(),
          ...(action.webhook.secret && { secret: action.webhook.secret }),
        },
      };

    case AlertRuleActionType.SEND_TEAMS_NOTIFICATION:
      return {
        ...base,
        teams: {
          ...(action.teams.webhookUrl && {
            webhookUrl: action.teams.webhookUrl.trim(),
          }),
        },
      };

    case AlertRuleActionType.SEND_SLACK_WEBHOOK_NOTIFICATION:
      return {
        ...base,
        slackWebhook: {
          ...(action.slackWebhook.webhookUrl && {
            webhookUrl: action.slackWebhook.webhookUrl.trim(),
          }),
        },
      };

    default:
      return {
        ...base,
        integration: action.integration || "123412341234123412341234",
        slack: {
          workspace: (action.slack.workspace || "").trim(),
          ...(action.slack.channelId && {
            channelId: action.slack.channelId.trim(),
          }),
          ...(action.slack.channelName && {
            channelName: action.slack.channelName.trim(),
          }),
        },
      };
  }
};

export const buildPayload = (state: RuleFormState) => ({
  name: state.name?.trim() || undefined,
  enabled: state.enabled,
  scope: {
    ...(state.environmentName && {
      environmentName: state.environmentName.trim(),
    }),
    ...(state.componentName && {
      componentName: state.componentName.trim(),
    }),
  },
  conditionOperator: state.conditionOperator,
  conditions: state.conditions.map((condition) => ({
    type: condition.type,
    ...(condition.interval && { interval: condition.interval.trim() }),
    ...(condition.value && { value: condition.value.trim() }),
  })),
  filterOperator: state.filterOperator,
  filters: state.filters.map((filter) => ({
    type: filter.type,
    ...(filter.interval && { interval: filter.interval.trim() }),
    ...(filter.attribute && { attribute: filter.attribute.trim() }),
    ...(filter.match && { match: filter.match }),
    ...(filter.value && { value: filter.value.trim() }),
  })),
  actions: state.actions.map(buildActionPayload),
});
