db.integrations.updateMany(
  { type: "GITHUB", metadata: { $exists: true } },
  [
    {
      $set: {
        github: {
          $mergeObjects: [
            "$github",
            {
              accessToken: "$metadata.accessToken",
              refreshToken: "$metadata.refreshToken",
              installationId: "$metadata.installationId",
              orgId: "$metadata.orgId",
              orgName: "$metadata.orgName",
              integrationSettingsUrl: "$metadata.integrationSettingsUrl",
            }
          ]
        }
      }
    },
  ]
)

db.integrations.updateMany(
  { type: "GITLAB", metadata: { $exists: true } },
  [
    {
      $set: {
        gitlab: {
          $mergeObjects: [
            "$gitlab",
            {
              accessToken: "$metadata.accessToken",
              refreshToken: "$metadata.refreshToken",
              integrationSettingsUrl: "$metadata.integrationSettingsUrl",
              apiKey: "$metadata.apiKey",
            }
          ]
        }
      }
    },
  ]
)

db.integrations.updateMany(
  { type: "BITBUCKET", metadata: { $exists: true } },
  [
    {
      $set: {
        bitbucket: {
          $mergeObjects: [
            "$bitbucket",
            {
              accessToken: "$metadata.accessToken",
              refreshToken: "$metadata.refreshToken",
              integrationSettingsUrl: "$metadata.integrationSettingsUrl"
            }
          ]
        }
      }
    },
  ]
)

db.integrations.updateMany(
  { type: "ATLASSIAN", metadata: { $exists: true } },
  [
    {
      $set: {
        atlassian: {
          $mergeObjects: [
            "$atlassian",
            {
              accessToken: "$metadata.accessToken",
              refreshToken: "$metadata.refreshToken",
              email: "$metadata.email",
              orgId: "$metadata.orgId",
              ticketStatusMapping: "$metadata.ticketStatusMapping"
            }
          ]
        }
      }
    },
  ]
)

db.integrations.updateMany(
  { type: "LINEAR", metadata: { $exists: true } },
  [
    {
      $set: {
        linear: {
          $mergeObjects: [
            "$linear",
            {
              accessToken: "$metadata.accessToken",
              ticketStatusMapping: "$metadata.ticketStatusMapping"
            }
          ]
        }
      }
    },
  ]
)

db.integrations.updateMany(
  { type: "OTEL", metadata: { $exists: true } },
  [
    {
      $set: {
        otel: {
          $mergeObjects: [
            "$otel",
            {
              apiKey: "$metadata.apiKey",
              autoCreateRelease: "$metadata.otel.autoCreateRelease",
              autoMergeEnabled: "$metadata.otel.autoMergeEnabled"
            }
          ]
        }
      }
    },
  ]
)

db.integrations.updateMany(
  { type: "API_KEY", metadata: { $exists: true } },
  [
    {
      $set: {
        apiKey: {
          $mergeObjects: [
            "$apiKey",
            { apiKey: "$metadata.apiKey" }
          ]
        }
      }
    },
  ]
)
