import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  FeatureFlag,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import get from './get'
import metadataList from './metadata-list'
import removeById from './remove-by-id'
import update from './update'
import starAdd from './star-add'
import starRemove from './star-remove'
import listUniqueComponents from './list-unique-components'
import bulkDelete from './bulk-delete'

const { Router } = express
const router = Router({ mergeParams: true })
const { FlowsValidationMiddleware } = ValidationMiddleware

router.route('/metadata').get(
  FlowsValidationMiddleware.validateListFlowsMetadata,
  authorize({
    entity: RoleProjectPermissionEntity.FLOW,
    action: RoleAccessAction.READ,
    featureFlag: FeatureFlag.FLOWS,
  }),
  metadataList,
)

router.route('/bulk').delete(
  FlowsValidationMiddleware.validateBulkDeleteFlows,
  authorize({
    entity: RoleProjectPermissionEntity.FLOW,
    action: RoleAccessAction.DELETE,
    bulk: true,
  }),
  bulkDelete,
)

router.route('/:flowId').get(
  FlowsValidationMiddleware.validateGetFlow,
  authorize({
    entity: RoleProjectPermissionEntity.FLOW,
    action: RoleAccessAction.READ,
    featureFlag: FeatureFlag.FLOWS,
  }),
  get,
)

router.route('/:flowId/metadata').patch(
  FlowsValidationMiddleware.validateUpdateFlowMetadata,
  authorize({
    entity: RoleProjectPermissionEntity.FLOW,
    action: RoleAccessAction.UPDATE,
    featureFlag: FeatureFlag.FLOWS,
  }),
  update,
)

router.route('/:flowId').delete(
  FlowsValidationMiddleware.validateDeleteFlowById,
  authorize({
    entity: RoleProjectPermissionEntity.FLOW,
    action: RoleAccessAction.DELETE,
    featureFlag: FeatureFlag.FLOWS,
  }),
  removeById,
)

router.route('/:flowId/metadata/stars').patch(
  FlowsValidationMiddleware.validateAddStarToFlowMetadata,
  authorize({
    entity: RoleProjectPermissionEntity.FLOW,
    action: RoleAccessAction.UPDATE,
    featureFlag: FeatureFlag.FLOWS,
  }),
  starAdd,
)

router.route('/:flowId/metadata/stars').delete(
  FlowsValidationMiddleware.validateRemoveStarFromFlowMetadata,
  authorize({
    entity: RoleProjectPermissionEntity.FLOW,
    action: RoleAccessAction.UPDATE,
    featureFlag: FeatureFlag.FLOWS,
  }),
  starRemove,
)

router.route('/metadata/unique-components').get(
  FlowsValidationMiddleware.validateListUniqueComponentsFromFlowsMetadata,
  authorize({
    entity: RoleProjectPermissionEntity.FLOW,
    action: RoleAccessAction.READ,
    featureFlag: FeatureFlag.FLOWS,
  }),
  listUniqueComponents,
)


export default router
