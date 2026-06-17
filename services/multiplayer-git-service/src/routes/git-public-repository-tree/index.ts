import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  ValidationMiddleware,
} from '../../middleware'
import list from './list'

const {
  GitPublicRepositoryTreeValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/:path').get(
  authorize(),
  GitPublicRepositoryTreeValidationMiddleware.validateGetGitPublicRepositoryTreeArgs,
  list,
)

export default router
