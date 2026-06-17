import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  ValidationMiddleware,
} from '../../middleware'
import list from './list'
import get from './get'

const {
  GitPublicRepositoryBranchValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  authorize(),
  GitPublicRepositoryBranchValidationMiddleware.validateListGitPublicRepositoryBranchesArgs,
  list,
)

router.route('/:branchName').get(
  authorize(),
  GitPublicRepositoryBranchValidationMiddleware.validateGetGitPublicRepositoryBranchArgs,
  get,
)

export default router
