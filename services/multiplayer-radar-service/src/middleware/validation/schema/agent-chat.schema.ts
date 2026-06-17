import { Joi } from '@multiplayer/util'
import {
  AgentChatStatus,
  AgentChatMessageRole,
  AgentChatToolCallStatus,
  AgentChatType,
  AgentType,
  AgentChatStartReasonEnum,
} from '@multiplayer/types'
import {
  agentAttachmentSchema,
  agentToolCallSchema,
} from './shared/agent.schema'

export const getPresignedUploadAttachmentUrlSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    filename: Joi.string().min(1).max(500).required(),
    mimeType: Joi.string().min(1).max(200).required(),
    size: Joi.number().integer().min(0).required(),
    chatId: Joi.string().required(),
    userId: Joi.string().optional(),
  }).required(),
})


export const listChatsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    skip: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1).max(1000),
    status: Joi.string().valid(...Object.values(AgentChatStatus)),
    agentId: Joi.string().hex().length(24),
    archived: Joi.boolean(),
    agentName: Joi.string().max(255),
    dir: Joi.string().max(1024),
  }).required(),
})

export const getChatSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    chatId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getChatMessagesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    chatId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    before: Joi.string().hex().length(24),
  }).required(),
})

export const streamMessageSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.alternatives(
    Joi.object({
      chatId: Joi.string(),
      content: Joi.string().min(1).required(),
      contextKey: Joi.string().min(1).required(),
      metadata: Joi.object().unknown(),
      model: Joi.string(),
      attachments: Joi.array().items(agentAttachmentSchema),
      userId: Joi.string().hex().length(24).allow('guest'),
    }),
    Joi.object({
      chatId: Joi.string().hex().length(24).required(),
      messageId: Joi.string(),
      approvalId: Joi.string().min(1).required(),
      approved: Joi.boolean(),
      userResponse: Joi.string().optional(),
      metadata: Joi.object({
        uploadedAt: Joi.string().optional(),
        s3Key: Joi.string().optional(),
        processingStatus: Joi.string().allow('pending', 'processed', 'failed').optional(),
        size: Joi.number().integer().min(0).optional(),
        lastModified: Joi.number().optional(),
      }).unknown().optional(),
      attachments: Joi.array().items(agentAttachmentSchema).optional(),
      model: Joi.string().optional(),
    }),
  ).required(),
})

export const generateTitleSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    chatId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const patchToolCallSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    chatId: Joi.string().hex().length(24).required(),
    messageId: Joi.string().required(),
    toolCallId: Joi.string().required(),
  }).required(),
  body: Joi.object({
    input: Joi.object().unknown(true),
    output: Joi.object().unknown(true),
    status: Joi.string().valid(...Object.values(AgentChatToolCallStatus)),
  })
    .or('input', 'output', 'status')
    .required(),
})

export const updateChatSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    chatId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    title: Joi.string(),
    archived: Joi.boolean(),
    metadata: Joi.any(),
    model: Joi.string(),
    agentName: Joi.string(),
  })
    .min(1)
    .required(),
})

export const updateChatInHandlerSchema = Joi.object({
  _id: Joi.string().hex().length(24).required(),

  title: Joi.string(),
  type: Joi.string().allow(AgentChatType),
  status: Joi.string().allow(AgentChatStatus),
  contextKey: Joi.string().allow(''),

  startedByWorkspaceUser: Joi.string().hex().length(24),
  userId: Joi.string().hex().length(24),

  startReason: Joi.string().valid(...Object.values(AgentChatStartReasonEnum)),
  metadata: Joi.any(),
  model: Joi.string(),
  agentName: Joi.string(),
  dir: Joi.string(),

  // context?: {
  //   issue?: {
  //     componentHash: string
  //   }
  // }
  codeChanges: Joi.object({
    additions: Joi.number(),
    deletions: Joi.number(),
  }),
  createdAt: Joi.string().isoDate(),
  updatedAt: Joi.string().isoDate(),
})

export const createChatSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    agentType: Joi.string().valid(...Object.values(AgentType)).required(),
    agentId: Joi.string().hex().length(24).optional(),
    context: Joi.object({
      issue: Joi.object({
        componentHash: Joi.string().required(),
      }).optional(),
      debugSession: Joi.object({
        _id: Joi.string().hex().length(24).required(),
      }).optional(),
    }).optional(),
  }).required(),
})

export const bulkRemoveChatsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string().hex().length(24)),
    status: Joi.string().valid(...Object.values(AgentChatStatus)),
    agentId: Joi.string().hex().length(24),
    type: Joi.string().valid(...Object.values(AgentChatType)),
  }).required(),
})

export const bulkUpdateChatsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    filter: Joi.object({
      ids: Joi.array().items(Joi.string().hex().length(24)),
      status: Joi.string().valid(...Object.values(AgentChatStatus)),
      agentId: Joi.string().hex().length(24),
      type: Joi.string().valid(...Object.values(AgentChatType)),
    }).required(),
    payload: Joi.object({
      title: Joi.string(),
      archived: Joi.boolean(),
      metadata: Joi.object().unknown(),
      model: Joi.string(),
      agentName: Joi.string(),
    })
      .min(1)
      .required(),
  }).required(),
})

export const createChatMessageSchema = Joi.object({
  chat: Joi.string().hex().length(24).required(),
  role: Joi.string().allow(...Object.values(AgentChatMessageRole)).required(),
  content: Joi.string().allow('', null),
  reasoning: Joi.string(),
  toolCalls: Joi.array().items(agentToolCallSchema),
  attachments: Joi.array().items(agentAttachmentSchema),
  annotations: Joi.any(),
  tokens: Joi.number(),
  activity: Joi.string(),
  agentName: Joi.string(),
  _id: Joi.string().hex().length(24),
})
