import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import { getAttachmentUploadPresignedUrl } from './get-attachment-presigned-url'


const { Router } = express
const router = Router({ mergeParams: true })

const {
  AgentChatAttachmentsValidationMiddleware,
} = ValidationMiddleware

router.route('/upload/presigned').post(
  AgentChatAttachmentsValidationMiddleware.validateGetAttachmentUploadPresignedUrl,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  getAttachmentUploadPresignedUrl,
)

export default router
