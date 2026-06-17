import * as yup from "yup";
import { AlertRuleActionType } from "@multiplayer/types";

export const alertRuleSchema = yup.object({
  name: yup.string().max(200).trim().required("Notification name is required"),
  enabled: yup.boolean().required(),
  environmentName: yup.string().max(100).trim(),
  componentName: yup.string().max(100).trim(),
  conditionOperator: yup.string().required(),
  conditions: yup
    .array()
    .of(
      yup.object({
        type: yup.string().required(),
        value: yup.string().nullable(),
        interval: yup.string().max(100),
      })
    )
    .min(1)
    .required(),
  filterOperator: yup.string().required(),
  filters: yup.array().of(
    yup.object({
      type: yup.string().required(),
      value: yup.string().nullable(),
      interval: yup.string().max(100),
      attribute: yup.string().nullable(),
      match: yup.string().nullable(),
    })
  ),
  actions: yup
    .array()
    .of(
      yup.object({
        type: yup.string().required("Action type is required"),
        integration: yup.string().nullable(),
        slack: yup
          .object({
            channelId: yup.string().max(100),
            channelName: yup.string().max(100),
            workspace: yup.string().max(200),
            notes: yup.string().max(500),
            tags: yup.string().max(200),
          })
          .when("type", (typeValue: any, schema) => {
            const typeStr = String(typeValue);
            if (typeStr === AlertRuleActionType.SEND_SLACK_NOTIFICATION) {
              return schema.required("Slack info is required").shape({
                channelId: yup.string().max(100),
                channelName: yup.string().max(100),
                workspace: yup.string().max(200),
                notes: yup.string().max(500),
                tags: yup.string().max(200),
              });
            }
            return schema.notRequired();
          }),
      })
    )
    .min(1)
    .required(),
});
