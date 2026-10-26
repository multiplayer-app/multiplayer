import * as yup from "yup";
import { AlertRuleActionType } from "@multiplayer/types";

const httpsUrl = () =>
  yup
    .string()
    .trim()
    .url("Enter a valid URL")
    .matches(/^https:\/\//i, {
      message: "The URL must use https",
      excludeEmptyString: true,
    });

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
        email: yup.object().when("type", (typeValue: any, schema) =>
          String(typeValue) === AlertRuleActionType.SEND_EMAIL_NOTIFICATION
            ? schema.shape({
                workspaceUsers: yup
                  .array()
                  .of(yup.string().required())
                  .min(1, "Select at least one workspace member")
                  .max(100, "Select at most 100 workspace members"),
              })
            : schema.notRequired()
        ),
        webhook: yup.object().when("type", (typeValue: any, schema) =>
          String(typeValue) === AlertRuleActionType.SEND_WEBHOOK_NOTIFICATION
            ? schema.shape({
                url: httpsUrl().max(2048).required("Webhook URL is required"),
                // Optional: empty keeps the stored secret
                secret: yup
                  .string()
                  .test(
                    "secret-length",
                    "The signing secret must be 16 to 256 characters",
                    (value) =>
                      !value || (value.length >= 16 && value.length <= 256)
                  ),
              })
            : schema.notRequired()
        ),
        teams: yup.object().when("type", (typeValue: any, schema) =>
          String(typeValue) === AlertRuleActionType.SEND_TEAMS_NOTIFICATION
            ? schema.shape({
                hasWebhookUrl: yup.boolean(),
                // Required unless one is stored already
                webhookUrl: httpsUrl()
                  .max(4096)
                  .when("hasWebhookUrl", {
                    is: true,
                    then: (urlSchema) => urlSchema,
                    otherwise: (urlSchema) =>
                      urlSchema.required("Teams webhook URL is required"),
                  }),
              })
            : schema.notRequired()
        ),
        slackWebhook: yup.object().when("type", (typeValue: any, schema) =>
          String(typeValue) === AlertRuleActionType.SEND_SLACK_WEBHOOK_NOTIFICATION
            ? schema.shape({
                hasWebhookUrl: yup.boolean(),
                // Required unless one is stored already
                webhookUrl: httpsUrl()
                  .max(2048)
                  .matches(/^https:\/\/hooks\.slack(-gov)?\.com\//i, {
                    message: "Enter a Slack incoming webhook URL (https://hooks.slack.com/...)",
                    excludeEmptyString: true,
                  })
                  .when("hasWebhookUrl", {
                    is: true,
                    then: (urlSchema) => urlSchema,
                    otherwise: (urlSchema) =>
                      urlSchema.required("Slack webhook URL is required"),
                  }),
              })
            : schema.notRequired()
        ),
      })
    )
    .min(1)
    .required(),
});
