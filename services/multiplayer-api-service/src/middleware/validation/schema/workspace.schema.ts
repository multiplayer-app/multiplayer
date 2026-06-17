import { Joi } from '@multiplayer/util'
import { SortOrder } from '@multiplayer/models'
import { FeatureFlag } from '@multiplayer/types'
import { AccessSchema } from './shared'

export const listWorkspaceSchema = Joi.object({
  query: Joi.object({
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortKey: Joi.string().max(100),
    sortDirection: Joi.number().valid(...Object.values(SortOrder)),
    text: Joi.string(),
  }).required(),
})

export const getWorkspaceSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const checkFeatureFlagSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    flag: Joi.string().valid(...Object.keys(FeatureFlag)),
  }).required(),
})

export const updateFeatureFlagSchema = Joi.object({
  body: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    flag: Joi.string().valid(...Object.keys(FeatureFlag)).required(),
    enabled: Joi.boolean().required(),
  }),
})

export const createWorkspaceSchema = Joi.object({
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string().required(),
    handle: Joi.string().required(),
    userId: Joi.string().hex().length(24),
    billing: Joi.object({
      stripe: Joi.object({
        priceId: Joi.string(),
      }),
    }),
  }).required(),
})

export const updateWorkspaceSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string(),
    handle: Joi.string(),
    settings: Joi.object({
      domainAutoJoin: Joi.object({
        enabled: Joi.boolean(),
        workspaceRoleId: Joi.string().hex().length(24).allow(null),
      }),
      memberProjectAccess: Joi.object({
        enabled: Joi.boolean(),
        projectRoleId: Joi.string().hex().length(24),
      }),
    }),
    isWorkspaceOnboarded: Joi.boolean().allow(true),
  }).required(),
})

export const updateWorkspaceIconSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteWorkspaceSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const addWorkspaceDomainSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    domain: Joi.string().domain().required(),
    email: Joi.string().email().required(),
  }).required(),
})

export const confirmWorkspaceDomainSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    code: Joi.string().required(),
  }).required(),
})

export const removeWorkspaceDomainSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    workspaceDomainId: Joi.string().hex().length(24).required(),
  }).required(),
})


export const getWorkspaceBillingAccountSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getWorkspaceBillingInfoSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const listWorkspaceRolesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateWorkspaceAccessSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  body: AccessSchema.accessSchema.required(),
})

export const getWorkspaceAccessPermissionsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getWorkspaceRoleSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})
