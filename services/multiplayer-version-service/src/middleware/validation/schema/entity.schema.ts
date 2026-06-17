import { Joi } from '@multiplayer/util'
import { EntityType } from '@multiplayer/types'
import { gitRefSchema } from './shared/git-ref.schema'
import { BulkAction } from '@multiplayer/types'
import { AccessSchema } from './shared'

export const listAllEntityAliasesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    type: Joi.alternatives().try(
      Joi.string().valid(...Object.values(EntityType)),
      Joi.array().items(Joi.string().valid(...Object.values(EntityType))),
    ),
  }).required(),
})

export const listEntitiesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    archived: Joi.boolean(),
    key: Joi.string(),
    type: Joi.string().valid(...Object.values(EntityType)),
    default: Joi.boolean(),
  }).required(),
})

export const getEntitySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
})
export const getEntityContentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const commitEntitySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createEntitySchema = Joi.object({
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    buffer: Joi.object().required(),
    size: Joi.number().required(),
  }),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    default: Joi.boolean(),
    key: Joi.string().required(),
    path: Joi.string(),
    keyAliases: Joi.array().items(Joi.string()),
    hostnames: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    type: Joi.string().valid(...Object.values(EntityType)).required(),
    gitRef: gitRefSchema,
    metadata: Joi.object().pattern(Joi.string(), Joi.string()),
    initialState: Joi.any(),
    sourceUri: Joi.string().uri().when('type', {
      is: [
        EntityType.FILE,
        EntityType.API,
      ],
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),
  }).oxor('gitRef', 'sourceUri', 'initialState').required(),
})

export const bulkCreateEntitiesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.array().items(Joi.object({
    action: Joi.string().valid(BulkAction.CREATE).default(BulkAction.CREATE),
    key: Joi.string().required(),
    keyAliases: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    type: Joi.string().valid(...Object.values(EntityType)).required(),
    gitRef: gitRefSchema,
    metadata: Joi.object().pattern(Joi.string(), Joi.string()),
    metaSummary: Joi.object({
      owner: Joi.string(),
      type: Joi.string().valid(...Object.values(EntityType)),
    }),
    data: Joi.object(),
    sourceUri: Joi.string().uri().when('type', {
      is: [
        EntityType.FILE,
        EntityType.API,
      ],
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),
  }).oxor('gitRef', 'sourceUri').required()).min(1).required(),
})

export const bulkUpdateEntitiesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.array().items(Joi.object({
    entityId: Joi.string().hex().length(24).required(),
    key: Joi.string(),
    keyAliases: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    path: Joi.string(),
    metadata: Joi.object().pattern(Joi.string(), Joi.string()),
  })).min(1).required(),
})

export const bulkDeleteEntitiesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    entityIds: Joi.array().items(Joi.string().hex().length(24)),
    type: Joi.string().valid(...Object.values(EntityType)),
  }).xor('entityIds', 'type').required(),
})

export const deleteEntitySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const aiCreateEntitySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string().max(256).required(),
    components: Joi.array().items(
      Joi.object({
        name: Joi.string().max(256).required(),
        position: Joi.object({
          x: Joi.number(),
          y: Joi.number(),
        }),
        type: Joi.string().required(),
        metadata: Joi.object().pattern(Joi.string(), Joi.string()),
        dependencies: Joi.array().items(Joi.string().max(256)),
        tags: Joi.array().items(Joi.object({
          key: Joi.string().max(200),
          value: Joi.string().max(200).required(),
        })).max(32),
      }),
    ).required(),
  }).required(),
})

export const updateEntitySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    key: Joi.string(),
    keyAliases: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    path: Joi.string(),
    gitRefBranch: Joi.string(),
    metadata: Joi.object().pattern(Joi.string(), Joi.string().allow('')),
  }).required(),
})

export const revertEntitySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const internalUpdateEntitySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    workspaceUsers: Joi.array().items(Joi.string().hex().length(24)).unique().required(),
    archived: Joi.boolean(),
    key: Joi.string(),
    keyAliases: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string().max(256)).max(20),
    path: Joi.string(),
    gitRefBranch: Joi.string(),
    metadata: Joi.object().pattern(Joi.string(), Joi.string().allow('')),
  }).required(),
})

export const mergeEntitiesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    key: Joi.string().required(),
    type: Joi.string().valid(...Object.values(EntityType)).required(),
    keyAliases: Joi.array().items(Joi.string()).default([]),
    entityIds: Joi.array().items(Joi.string()).default([]),
  }).custom((value, helpers) => {
    const { keyAliases, entityIds } = value

    if (keyAliases.length === 0 && entityIds.length === 0) {
      return helpers.message({
        custom: 'Either keyAliases or entityIds must be non-empty',
      })
    }

    return value
  }).required(),
})

export const entityAccessUpdateSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
  body: AccessSchema.accessSchema.required(),
})
