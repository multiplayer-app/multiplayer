import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { createChat } from './create'
import { listChats } from './list'
import { getChat } from './get'
import { getMessages } from './messages'
import { deleteChat } from './delete'
import { streamMessage } from './stream'
import { generateTitle } from './title'
import { getArtifacts } from './artifacts'
import { getStream } from './getStream'
import { abortMessage } from './abort'
import { postChatAction } from './actions'
import { patchToolCall } from './updateToolCall'
import { updateChat } from './update'
import { ValidationMiddleware } from '../../middleware'
import { bulkRemoveChats } from './bulk-remove'
import { bulkUpdateChats } from './bulk-update'
import { attachDebugSession } from './attach-debug-session'
import { detachDebugSession } from './detach-debug-session'

const { Router } = express
const router = Router({ mergeParams: true })
const {
  AgentChatValidationMiddleware,
} = ValidationMiddleware

router.route('/bulk').delete(
  AgentChatValidationMiddleware.validateBulkDeleteChats,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.DELETE,
    bulk: true,
  }),
  bulkRemoveChats,
)

router.route('/bulk').patch(
  AgentChatValidationMiddleware.validateBulkUpdateChats,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  bulkUpdateChats,
)

router.route('/').get(
  AgentChatValidationMiddleware.validateListChats,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.READ,
  }),
  listChats,
)

router.route('/').post(
  AgentChatValidationMiddleware.validateCreateChat,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.CREATE,
  }),
  createChat,
)

router.route('/:chatId/messages').get(
  AgentChatValidationMiddleware.validateGetChatMessages,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.READ,
  }),
  getMessages,
)

router.route('/:chatId').get(
  AgentChatValidationMiddleware.validateGetChat,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.READ,
  }),
  getChat,
)

router.route('/:chatId').patch(
  AgentChatValidationMiddleware.validateUpdateChat,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.UPDATE,
  }),
  updateChat,
)

router.route('/:chatId').delete(
  AgentChatValidationMiddleware.validateGetChat,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.DELETE,
  }),
  deleteChat,
)

router.route('/stream').post(
  AgentChatValidationMiddleware.validateStreamMessage,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.CREATE,
  }),
  streamMessage,
)

router.route('/title').post(
  AgentChatValidationMiddleware.validateGenerateTitle,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.CREATE,
  }),
  generateTitle,
)

router.route('/:chatId/artifacts').get(
  AgentChatValidationMiddleware.validateGetChat,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.READ,
  }),
  getArtifacts,
)

router.route('/:chatId/stream').get(
  AgentChatValidationMiddleware.validateGetChat,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.READ,
  }),
  getStream,
)

router.route('/:chatId/abort').post(
  AgentChatValidationMiddleware.validateGetChat,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.UPDATE,
  }),
  abortMessage,
)

router.route('/:chatId/actions').post(
  AgentChatValidationMiddleware.validateGetChat,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.CREATE,
  }),
  postChatAction,
)

router.route('/:chatId/messages/:messageId/tool-calls/:toolCallId').patch(
  AgentChatValidationMiddleware.validatePatchToolCall,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.UPDATE,
  }),
  patchToolCall,
)

router.route('/:chatId/debug-sessions').post(
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.UPDATE,
  }),
  attachDebugSession,
)

router.route('/:chatId/debug-sessions/:debugSessionId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.UPDATE,
  }),
  detachDebugSession,
)

export default router
