import { Joi } from '@multiplayer/util'

export const accessSchema = Joi.object({
  guest: Joi.object({
    enabled: Joi.boolean(),
    role: Joi.string().hex().length(24).required(),
  }),

  emails: Joi.array().items(Joi.string().email()).unique(),

  workspaceUsers: Joi.array().items(Joi.object({
    workspaceUser: Joi.string().hex().length(24).required(),
    role: Joi.string().hex().length(24).required(),
  })).unique((a, b) => a.workspaceUser !== b.workspaceUser),

  projects: Joi.array().items(Joi.object({
    project: Joi.string().hex().length(24).required(),
    role: Joi.string().hex().length(24).required(),
  })).unique((a, b) => a.project !== b.project),

  workspaces: Joi.array().items(Joi.object({
    workspace: Joi.string().hex().length(24).required(),
    role: Joi.string().hex().length(24).required(),
  })).unique((a, b) => a.workspace !== b.workspace),

  publicLink: Joi.object({
    token: Joi.boolean(),
    role: Joi.string().hex().length(24).required(),
  }),
})
