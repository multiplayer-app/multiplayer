import {
  AlertRuleActionType,
  AlertRuleConditionType,
  AlertRuleFilterType,
  AlertRuleFilterCondition,
} from "@multiplayer/types";

export type RuleConditionState = {
  type: AlertRuleConditionType;
  interval?: string;
  value?: string;
};

export type RuleFilterState = {
  type: AlertRuleFilterType;
  interval?: string;
  attribute?: string;
  match?: AlertRuleFilterCondition;
  value?: string;
};

export type RuleActionState = {
  // Lets the API keep the stored, write-only credentials of this action
  _id?: string;
  type: AlertRuleActionType;
  integration?: string;
  slack: {
    workspace: string;
    channelId?: string;
    channelName?: string;
    notes?: string;
    tags?: string;
  };
  email: {
    workspaceUsers: string[];
  };
  webhook: {
    url: string;
    // Write-only: left empty, the stored secret is kept
    secret: string;
    hasSecret?: boolean;
  };
  teams: {
    // Write-only: left empty, the stored URL is kept
    webhookUrl: string;
    hasWebhookUrl?: boolean;
  };
  slackWebhook: {
    // Write-only: left empty, the stored URL is kept
    webhookUrl: string;
    hasWebhookUrl?: boolean;
  };
};

export type RuleFormState = {
  name: string;
  enabled: boolean;
  environmentName: string;
  componentName: string;
  conditionOperator: "ALL" | "ANY";
  conditions: RuleConditionState[];
  filterOperator: "ALL" | "ANY" | "NONE";
  filters: RuleFilterState[];
  actions: RuleActionState[];
};
