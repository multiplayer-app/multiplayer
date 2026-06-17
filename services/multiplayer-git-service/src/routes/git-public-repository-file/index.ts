import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  ValidationMiddleware,
} from '../../middleware'
import get from './get'

const {
  GitPublicRepositoryFileValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/:path/contents').get(
  authorize(),
  GitPublicRepositoryFileValidationMiddleware.validateGetGitPublicRepositoryFileContentsArgs,
  get,
)

export default router
