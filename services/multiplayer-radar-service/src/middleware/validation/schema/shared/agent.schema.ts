import { Joi } from '@multiplayer/util'
import {
  AgentChatToolCallStatus,
  AgentChatAttachmentType,
} from '@multiplayer/types'

export const agentToolCallSchema = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  input: Joi.any(),
  status: Joi.string().allow(...Object.values(AgentChatToolCallStatus)).required(),
  output: Joi.any(),
  error: Joi.string(),
  requiresConfirmation: Joi.boolean(),
  requiresUserAction: Joi.boolean(),
  approved: Joi.boolean(),
  approvalId: Joi.string(),
  userResponse: Joi.string(),
})

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

const contextSecuritySchema = Joi.object({
  containsPII: Joi.boolean(),
  redactionsApplied: Joi.array().items(Joi.string()),
})

const contextSourceSchema = Joi.object({
  app: Joi.string(),
  url: Joi.string(),
  route: Joi.string(),
  domPath: Joi.string(),
})

// Context metadata — base fields required for all kinds; extra fields (selectedText,
// fields, value, data, title, summary, etc.) vary by kind so we allow unknown keys.
const contextMetadataSchema = Joi.object({
  schemaVersion: Joi.number().valid(1).required(),
  kind: Joi.string().required(),
  capturedAt: Joi.string().isoDate().required(),
  source: contextSourceSchema,
  security: contextSecuritySchema,
  // Built-in kind fields
  title: Joi.string(),
  summary: Joi.string(),
  selectedText: Joi.string(),
  // Custom kind payload
  data: Joi.object().unknown(true),
  // form-related
  formId: Joi.string(),
  formName: Joi.string(),
  fieldName: Joi.string(),
  fieldLabel: Joi.string(),
  value: Joi.string(),
  fields: Joi.array().items(Joi.object().unknown(true)),
  domPath: Joi.string(),
}).unknown(true) // allow future fields without a schema change

// ─── Per-type attachment schemas ──────────────────────────────────────────────

const contextAttachmentSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(AgentChatAttachmentType.Context).required(),
  name: Joi.string().required(),
  url: Joi.string(),
  mimeType: Joi.string(),
  metadata: contextMetadataSchema.required(),
})

const fileAttachmentSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(AgentChatAttachmentType.File).required(),
  name: Joi.string().required(),
  url: Joi.string(),
  mimeType: Joi.string(),
  size: Joi.number(),
  metadata: Joi.object({
    uploadedAt: Joi.string(),
    s3Key: Joi.string(),
    s3Bucket: Joi.string(),
    processingStatus: Joi.string().valid('pending', 'failed', 'processed'),
    size: Joi.number(),
    lastModified: Joi.number(),
  }).unknown(true),
})

const linkAttachmentSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(AgentChatAttachmentType.Link).required(),
  name: Joi.string().required(),
  url: Joi.string(),
  mimeType: Joi.string(),
  metadata: Joi.object().unknown(true),
})

const artifactAttachmentSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(AgentChatAttachmentType.Artifact).required(),
  name: Joi.string().required(),
  url: Joi.string(),
  mimeType: Joi.string(),
  metadata: Joi.object().unknown(true),
})

// ─── Public export ────────────────────────────────────────────────────────────

export const agentAttachmentSchema = Joi.alternatives().try(
  contextAttachmentSchema,
  fileAttachmentSchema,
  linkAttachmentSchema,
  artifactAttachmentSchema,
)
