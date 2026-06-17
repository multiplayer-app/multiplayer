import { Joi } from '@multiplayer/util'
import { IssueCategoryEnum } from '@multiplayer/types'
import { AccessSchema } from './shared'

export const listProjectsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const getProjectSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getProjectAggregatedRoleSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createProjectSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string().required(),
    version: Joi.string(),
  }).required(),
})

export const updateProjectSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string(),
    version: Joi.string(),

    settings: Joi.object({
      agent: Joi.object({
        fixabilityScoreThreshold: Joi.number().integer().min(0).max(100),
      }),
      issue: Joi.object({
        createOnlyForCategories: Joi.array().items(
          Joi.string().valid(...Object.values(IssueCategoryEnum)),
        ),
      }),
      conditionalRecording: Joi.object({
        enabled: Joi.boolean(),
        samplingRate: Joi.number().min(0).max(1),
        maxRemoteSessionRecordings: Joi.number().min(1),
        recordingOptions: Joi.object({
          frontend: Joi.object({
            screens: Joi.boolean(),
            traces: Joi.boolean(),
            logs: Joi.boolean(),
            logLevel: Joi.string().valid('debug', 'info', 'warn', 'error'),
            content: Joi.boolean(),
          }),
          backend: Joi.object({
            traces: Joi.boolean(),
            logs: Joi.boolean(),
            logLevel: Joi.string().valid('debug', 'info', 'warn', 'error'),
            content: Joi.boolean(),
          }),
        }),
        startConditions: Joi.object({
          startOnError: Joi.boolean(),
        }),
        stopConditions: Joi.object({
          idleTime: Joi.number().min(0),
          maxTime: Joi.number().min(0),
        }),
      }),
    }),
  }).required(),
})

export const deleteProjectSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateProjectIconSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateProjectCoverImageSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const addProjectUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().hex().length(24),
  }).required(),
})

export const listProjectUsersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const updateProjectUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectUserId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    role: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteProjectUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectUserId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateProjectAccessSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: AccessSchema.accessSchema.required(),
})

export const getProjectAccessPermissionsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})
