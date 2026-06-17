import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  ValidationMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import list from './list'

const { Router } = express
const router = Router({ mergeParams: true })
const { PlatformRelationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize(),
  PlatformRelationMiddleware.validateListPlatformRelations,
  list,
)

router.route('/').post(
  authorize(),
  PlatformRelationMiddleware.validateCreatePlatformRelation,
  create,
)

router.route('/').delete(
  authorize(),
  PlatformRelationMiddleware.validateDeletePlatformRelations,
  remove,
)

export default router
