import { Joi } from '@multiplayer/util'

export const inviteWorkspaceUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    sendEmail: Joi.boolean(),
    emails: Joi.array().items(Joi.string().email()).min(1).required(),
    teams: Joi.array().items(Joi.string().hex().length(24)),
    role: Joi.string().hex().length(24),
    teamRole: Joi.string().hex().length(24),
    addToWorkspace: Joi.boolean(),
  }).required(),
})

export const listWorkspaceUsersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const updateWorkspaceUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    workspaceMemberId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    role: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteWorkspaceUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    workspaceMemberId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const resendWorkspaceUserInvitationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    workspaceUserId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const leaveWorkspaceSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})
