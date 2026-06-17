import type { IRadarDetection } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import {
  ReleaseModel,
  EntityModel,
  DeploymentModel,
} from '@multiplayer/models'
import {
  RadarDetectionType,
  EntityType,
} from '@multiplayer/types'
import * as ProjectBranchService from './project-branch.service'
import * as IntegrationService from './integration.service'
import {
  DeploymentCache,
  ReleaseCache,
} from '../cache'

export const upsertRelease = async (
  workspaceId: string,
  projectId: string,
  serviceName: string,
  releaseName: string,
  environmentName?: string,
) => {
  try {
    if (
      !serviceName
      || !releaseName
    ) {
      return
    }

    const cachedRelease = await ReleaseCache.get(
      workspaceId,
      projectId,
      serviceName,
      releaseName,
    )

    if (cachedRelease) {
      return
    }

    const defaultProjectBranchId = await ProjectBranchService.getDefaultProjectBranchIdByProjectId(
      projectId,
    )

    const component = await EntityModel.getEntityInBranchByKey(
      serviceName,
      defaultProjectBranchId,
      {
        workspace: workspaceId,
        project: projectId,
        type: EntityType.PLATFORM_COMPONENT,
      },
    )

    if (!component) {
      return
    }

    const release = await ReleaseModel.upsertRelease({
      workspace: workspaceId,
      project: projectId,
      version: releaseName,
      entity: component.entityId,
    })

    await ReleaseCache.set(
      workspaceId,
      projectId,
      serviceName,
      releaseName,
      release._id.toString(),
    )

    if (!environmentName) {
      return
    }

    const cachedDeployment = await DeploymentCache.get(
      workspaceId,
      projectId,
      serviceName,
      environmentName,
      releaseName,
    )

    if (cachedDeployment) {
      return
    }

    const environmentEntity = await EntityModel.getEntityInBranchByKey(
      environmentName,
      defaultProjectBranchId,
      {
        workspace: workspaceId,
        project: projectId,
        type: EntityType.ENVIRONMENT,
      },
    )

    const environmentEntityId = environmentEntity?.entityId?.toString()

    if (!environmentEntityId) {
      await DeploymentCache.set(
        workspaceId,
        projectId,
        serviceName,
        environmentName,
        releaseName,
      )

      return
    }

    const { data: [latestDeployment] } = await DeploymentModel.findDeployments(
      {
        workspace: workspaceId,
        project: projectId,
        entity: component.entityId,
        environment: environmentEntityId,
      },
      {
        skip: 0,
        limit: 1,
      },
      {
        sortKey: '_id',
        sortDirection: -1,
      },
    )

    await Promise.all([
      ...(latestDeployment?.release?.toString() !== release._id.toString() ? [
        DeploymentModel.createDeployment({
          workspace: workspaceId,
          project: projectId,
          entity: component.entityId,
          release: release._id,
          environment: environmentEntityId,
        }),
      ] : []),
      DeploymentCache.set(
        workspaceId,
        projectId,
        serviceName,
        environmentName,
        releaseName,
      ),
    ])
  } catch (error) {
    logger.error(
      error,
      {
        workspaceId,
        projectId,
        serviceName,
        environmentName,
        releaseName,
      },
      'Failed to auto create release',
    )
  }
}


export const autoCreateReleaseIfNeeded = async (detections: IRadarDetection[]) => {
  if (!detections.length) {
    return
  }

  await Promise.all(detections.map(async detection => {
    const serviceName = detection.componentName
    const environmentName = detection.environmentName
    const releaseName = (detection as any).release

    if (
      detection.type !== RadarDetectionType.SERVICE
      || !detection.integrationId
      || !serviceName
      || !releaseName
    ) {
      return
    }

    const integration = await IntegrationService.getIntegrationById(detection.integrationId)

    if (
      !integration.otel?.autoCreateRelease
      || !(detection as any)?.release
    ) {
      return
    }

    await upsertRelease(
      integration.workspace.toString(),
      integration.project?.toString() as string,
      serviceName,
      releaseName,
      environmentName,
    )
  }))
}
