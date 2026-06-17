import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  ValidationMiddleware,
} from '../../middleware'
import list from './list'

const { Router } = express
const router = Router({ mergeParams: true })
const { EntityShareMeValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize(),
  EntityShareMeValidationMiddleware.validateListEntitiesSharedWithMe,
  list,
)

export default router
