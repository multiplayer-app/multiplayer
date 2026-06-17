import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  DebugSessionModel,
  FlowMetadataModel,
  ProjectBranchModel,
  EntityModel,
} from '@multiplayer/models'
import {
  RadarDetectionType,
  ErrorMessage,
  EntityType,
} from '@multiplayer/types'
import {
  RadarDetectionService,
} from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string

    const defaultProjectBranch = await ProjectBranchModel.getDefaultProjectBranch(projectId)

    if (!defaultProjectBranch) {
      throw new NotFoundError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND)
    }

    const [
      components,
      apis,
      flows,
      debugSessions,
      platforms,
      dependencies,
      environments,
    ] = await Promise.all([
      RadarDetectionService.getRadarDetectionsWithSignCount({
        workspaceId,
        projectId,
        type: RadarDetectionType.SERVICE,
      }),
      RadarDetectionService.getRadarDetectionsWithSignCount({
        workspaceId,
        projectId,
        type: RadarDetectionType.ENDPOINT,
      }),
      FlowMetadataModel.countFlowsMetadata({
        workspace: workspaceId,
        project: projectId,
      }),
      DebugSessionModel.countDebugSessions({
        workspace: workspaceId,
        project: projectId,
      }),
      EntityModel.countEntitiesInBranch({
        workspaceId,
        projectId,
        projectBranchId: defaultProjectBranch._id,
        type: EntityType.PLATFORM,
        default: false,
      }),
      RadarDetectionService.getRadarDetectedDependenciesCount({
        workspaceId,
        projectId,
        type: RadarDetectionType.DEPENDENCY,
      }),
      EntityModel.countEntitiesInBranch({
        workspaceId,
        projectId,
        projectBranchId: defaultProjectBranch._id,
        type: EntityType.ENVIRONMENT,
      }),
    ])

    const data = {
      components,
      apis,
      platforms,
      dependencies,
      flows,
      debugSessions,
      environments,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
