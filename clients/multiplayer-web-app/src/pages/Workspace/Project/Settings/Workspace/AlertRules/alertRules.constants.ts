import {
  AlertRuleConditionType,
  AlertRuleFilterType,
} from "@multiplayer/types";
import { CreatableSelectOption } from "shared/components/CreatableSelect";

export const ENVIRONMENT_OPTIONS: CreatableSelectOption[] = [
  { label: "prod", value: "prod" },
  { label: "test", value: "test" },
  { label: "staging", value: "staging" },
  { label: "demo", value: "demo" },
];

export const ATTRIBUTE_OPTIONS: CreatableSelectOption[] = [
  { label: "Type", value: "type" },
  { label: "ID", value: "id" },
  { label: "Name", value: "name" },
  { label: "Group ID", value: "groupId" },
  { label: "Group name", value: "groupName" },
  { label: "User email", value: "userEmail" },
  { label: "User ID", value: "userId" },
  { label: "User name", value: "userName" },
  { label: "Account ID", value: "accountId" },
  { label: "Account name", value: "accountName" },
  { label: "Organization ID", value: "orgId" },
  { label: "Organization name", value: "orgName" },
];

export const CONDITION_LABELS: Partial<Record<AlertRuleConditionType, string>> =
  {
    [AlertRuleConditionType.NEW_ISSUE_CREATED]: "New issue created",
    [AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN]:
      "Number of spans in issue is greater",
    [AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN]:
      "Number of affected users in issue is greater",
    [AlertRuleConditionType.SESSION_RECORDING_CREATED]:
      "Session Recording created",
    [AlertRuleConditionType.ISSUE_UNARCHIVED]: "Issue unarchived",
  };

export const FILTER_LABELS: Record<AlertRuleFilterType, string> = {
  [AlertRuleFilterType.ISSUE_OLDER_THAN]: "older",
  [AlertRuleFilterType.ISSUE_NEWER_THAN]: "newer",
  [AlertRuleFilterType.ATTRIBUTE_FILTER]: "attribute filter",
};

export const FILTER_CONDITION_LABELS = {
  EQUALS: "equals",
  NOT_EQUALS: "not equals",
  CONTAINS: "contains",
  NOT_CONTAINS: "not contains",
  EXISTS: "exists",
  NOT_EXISTS: "not exists",
} as const;

export const CONDITION_INTERVAL_OPTIONS = [
  { label: "one minute", value: "1m" },
  { label: "5 minutes", value: "5m" },
  { label: "15 minutes", value: "15m" },
  { label: "one hour", value: "1h" },
  { label: "one day", value: "1d" },
  { label: "one week", value: "1w" },
  { label: "1 month", value: "1mo" },
] as const;

export const FILTER_INTERVAL_OPTIONS = [
  { label: "minute(s)", value: "m" },
  { label: "hour(s)", value: "h" },
  { label: "day(s)", value: "d" },
  { label: "week(s)", value: "w" },
] as const;
