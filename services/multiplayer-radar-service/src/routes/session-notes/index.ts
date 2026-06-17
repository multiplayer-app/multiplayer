import express from 'express'
import { authorize } from '@multiplayer/auth'
import { RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'
import { ValidationMiddleware, DebugSessionMiddleware } from '../../middleware'
import get from './get'
import create from './save'
import remove from './remove'
import downloadUpdate from './download-update'
import uploadUpdate from './upload-update'
import downloadFile from './download-file'
import uploadFile from './upload-file'
const { Router } = express
const router = Router({ mergeParams: true })
const { SessionNotesValidationMiddleware } = ValidationMiddleware

router.route('/')
  .get(
    SessionNotesValidationMiddleware.validateGetSessionNote,
    authorize({
      entity: RoleProjectPermissionEntity.SESSION_NOTES,
      action: RoleAccessAction.READ,
    }),
    get,
  )
  .post(
    SessionNotesValidationMiddleware.validateCreateSessionNote,
    authorize({
      entity: RoleProjectPermissionEntity.SESSION_NOTES,
      action: RoleAccessAction.CREATE,
    }),
    create,
  )
  .delete(
    SessionNotesValidationMiddleware.validateDeleteSessionNote,
    authorize({
      entity: RoleProjectPermissionEntity.SESSION_NOTES,
      action: RoleAccessAction.DELETE,
    }),
    remove,
  )

router.route('/updates/:updateId')
  .post(
    SessionNotesValidationMiddleware.validateGetSessionNoteUpdate,
    authorize({
      entity: RoleProjectPermissionEntity.SESSION_NOTES,
      action: RoleAccessAction.READ,
    }),
    uploadUpdate,
  )
  .get(
    SessionNotesValidationMiddleware.validateGetSessionNoteUpdate,
    authorize({
      entity: RoleProjectPermissionEntity.SESSION_NOTES,
      action: RoleAccessAction.READ,
    }),
    downloadUpdate,
  )

router.route('/files/:blockId')
  .post(
    SessionNotesValidationMiddleware.validateGetSessionNoteFile,
    authorize({
      entity: RoleProjectPermissionEntity.SESSION_NOTES,
      action: RoleAccessAction.READ,
    }),
    uploadFile,
  )
  .get(
    SessionNotesValidationMiddleware.validateGetSessionNoteFile,
    authorize({
      entity: RoleProjectPermissionEntity.SESSION_NOTES,
      action: RoleAccessAction.READ,
    }),
    downloadFile,
  )

// Content route moved to assets service

export default router


