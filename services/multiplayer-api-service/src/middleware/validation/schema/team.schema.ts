import { Joi } from '@multiplayer/util'

export const listTeamSchema = Joi.object({
  query: Joi.object({
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getTeamSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createTeamSchema = Joi.object({
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string().required(),
  }).required(),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateTeamSchema = Joi.object({
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string(),
  }).required(),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateTeamIconSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteTeamSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const listTeamUsersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const updateTeamUserSchema = Joi.object({
  body: Joi.object({
    role: Joi.string().hex().length(24).required(),
  }).required(),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
    teamUserId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteTeamUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
    teamUserId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const listTeamProjectsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const addProjectToTeamSchema = Joi.object({
  body: Joi.object({
    project: Joi.string().hex().length(24).required(),
  }).required(),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const removeProjectFromTeamSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    teamId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    project: Joi.string().hex().length(24).required(),
  }).required(),
})
