import { Joi } from '@multiplayer/util'
import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
  OtelAgentSelectionMode,
  ProjectBranchStatus,
} from '@multiplayer/types'
import { FRONTEND_DOMAIN, FRONTEND_PROTOCOL } from '../../../config'

export const createIntegrationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().when('type', {
      is: [IntegrationTypeEnum.OTEL, IntegrationTypeEnum.API_KEY],
      then: Joi.required(),
    }),
    description: Joi.string(),
    project: Joi.string()
      .hex()
      .length(24)
      .when('type', {
        is: [IntegrationTypeEnum.API_KEY, IntegrationTypeEnum.OTEL],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    workspaceRole: Joi.string()
      .hex()
      .length(24)
      .when('type', {
        is: [IntegrationTypeEnum.API_KEY],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    projectRole: Joi.string()
      .hex()
      .length(24)
      .when('type', {
        is: [IntegrationTypeEnum.API_KEY],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    type: Joi.string()
      .valid(...Object.values(IntegrationTypeEnum))
      .required(),
    authType: Joi.string()
      .valid(IntegrationAuthTypeEnum.ACCESS_TOKEN)
      .when('type', {
        is: [
          IntegrationTypeEnum.BITBUCKET,
          IntegrationTypeEnum.GITHUB,
          IntegrationTypeEnum.GITLAB,
        ],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),

    otel: Joi.object({
      autoCreateRelease: Joi.boolean(),
      autoMergeEnabled: Joi.boolean(),
      agentSelectionMode: Joi.string().valid(
        ...Object.values(OtelAgentSelectionMode),
      ).default(OtelAgentSelectionMode.ANY),
      autoResolveIssues: Joi.boolean(),
      autoCreateIssues: Joi.boolean(),
    }).when('type', {
      is: [IntegrationTypeEnum.OTEL],
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),
  }),
})

export const updateIntegrationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    workspaceRole: Joi.string().hex().length(24),
    projectRole: Joi.string().hex().length(24),
    otel: Joi.object({
      autoCreateRelease: Joi.boolean(),
      autoMergeEnabled: Joi.boolean(),
      agentSelectionMode: Joi.string().valid(
        ...Object.values(OtelAgentSelectionMode),
      ),
      autoResolveIssues: Joi.boolean(),
      autoCreateIssues: Joi.boolean(),
    }),
  }),
})

export const listIntegrationsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    skip: Joi.number().integer().min(0).max(1000),
    limit: Joi.number().integer().min(0),
    type: Joi.string().valid(...Object.values(IntegrationTypeEnum)),
    project: Joi.string().hex().length(24),
  }).required(),
})

export const getIntegrationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }),
})

export const resyncIntegrationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }),
})

export const deleteIntegrationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }),
})

export const getGithubAppIntegrationInstallUrlSchema = Joi.object({
  query: Joi.object({
    workspace: Joi.string().hex().length(24).required(),
    redirectUrl: Joi.string().uri().max(1000),
  })
    .custom((value, helpers) => {
      const { redirectUrl } = value

      if (!redirectUrl?.length) {
        return value
      }

      const parsedUrl = new URL(redirectUrl)

      if (
        parsedUrl.hostname !== FRONTEND_DOMAIN ||
        parsedUrl.protocol !== `${FRONTEND_PROTOCOL}:`
      ) {
        return helpers.message({
          custom: 'Not valid redirect url',
        })
      }

      return value
    })
    .required(),
})

export const githubAppIntegrationPostInstallHook = Joi.object({
  query: Joi.object({
    installation_id: Joi.string().required(),
    setup_action: Joi.string().required(),
    state: Joi.string().required(),
  }).required(),
})

export const updateLinearIntegrationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    metadata: {
      ticketStatusMapping: Joi.array().items(
        Joi.object({
          projectBranchStatus: Joi.string()
            .valid(...Object.values(ProjectBranchStatus))
            .required(),
          ticketStatus: Joi.string().required(),
        }),
      ),
    },
  }).required(),
})

export const updateAtlassianIntegrationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    atlassian: {
      // orgId: Joi.string().required(),
      ticketStatusMapping: Joi.array().items(
        Joi.object({
          projectBranchStatus: Joi.string()
            .valid(...Object.values(ProjectBranchStatus))
            .required(),
          ticketStatus: Joi.string().required(),
        }),
      ),
    },
  }).required(),
})

export const rotateOtelIntegrationKeySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({}),
})

export const getOtelIntegrationStatusSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getLinearIntegrationStatusesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getAtlassianIntegrationStatusesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    orgId: Joi.string().required(),
  }).required(),
})

export const getAtlassianIntegrationOrgsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }).required(),
})
