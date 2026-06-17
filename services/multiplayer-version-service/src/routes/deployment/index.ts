import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
} from '../../middleware'
import list from './list'
import get from './get'
import create from './create'

const { DeploymentValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.DEPLOYMENT,
    action: RoleAccessAction.READ,
  }),
  DeploymentValidationMiddleware.validateListDeploymentsArgs,
  list,
)

router.route('/:deploymentId').get(
  authorize({
    entity: RoleProjectPermissionEntity.DEPLOYMENT,
    action: RoleAccessAction.READ,
  }),
  DeploymentValidationMiddleware.validateGetDeploymentArgs,
  get,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.DEPLOYMENT,
    action: RoleAccessAction.CREATE,
  }),
  DeploymentValidationMiddleware.validateCreateDeploymentArgs,
  create,
)

export default router
