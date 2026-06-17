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
  type: AlertRuleActionType;
  integration?: string;
  slack: {
    workspace: string;
    channelId?: string;
    channelName?: string;
    notes?: string;
    tags?: string;
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
