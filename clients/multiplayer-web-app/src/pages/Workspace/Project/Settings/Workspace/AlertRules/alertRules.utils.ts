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
  type: AlertRuleActionType.SEND_SLACK_NOTIFICATION,
  integration: integration?._id || null,
  slack: {
    workspace: integration?.slack?.teamName || "",
    channelId: "",
    channelName: "",
    notes: "",
    tags: "",
  },
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
    type: action.type,
    integration: action.integration || "",
    slack: {
      workspace: integration?.slack?.teamName || "",
      channelId: action.slack?.channelId || "",
      channelName: action.slack?.channelName || "",
      notes: action.slack?.notes || "",
      tags: action.slack?.tags || "",
    },
  })) ?? [createAction(integration)],
});

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
  actions: state.actions.map((action) => ({
    type: action.type,
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
  })),
});
