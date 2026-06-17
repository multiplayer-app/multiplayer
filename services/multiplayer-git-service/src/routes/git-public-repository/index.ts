import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  ValidationMiddleware,
} from '../../middleware'
import list from './list'

const {
  GitPublicRepositoryValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/git').get(
  authorize(),
  GitPublicRepositoryValidationMiddleware.validateListGitPublicRepositoriesArgs,
  list,
)

export default router
