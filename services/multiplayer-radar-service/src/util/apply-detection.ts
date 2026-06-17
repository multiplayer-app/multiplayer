import {
  EntityType,
  IEntity,
  IRadarDetection,
  RadarDetectionType,
  RadarDetectionSource,
  EntityCommitChangeType,
} from '@multiplayer/types'
import {
  EntityModel,
  ProjectBranchModel,
  IProjectBranchDocument,
} from '@multiplayer/models'
import { PlatformHelper, Y } from '@multiplayer/entity'
import logger from '@multiplayer/logger'
import {
  InternalVersionService,
  VersionService,
  RadarDetectionService,
  EntityService,
} from '../services'
import * as PlatformUtil from './platform.util'
import { shareEntityUpdate } from '../amqp'
import { slugifyString } from '@multiplayer/util-shared'

export const applyEnvironmentDetection = async (
  detection: IRadarDetection,
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  cookie?: string,
): Promise<void> => {

  if (detection.environmentNames?.length !== 1) {
    logger.error(`[APPLY-DETECTION] Failed to get environmentName for detection ${detection.id}`)
    return
  }

  const environmentName = detection.environmentNames?.[0]

  if (environmentName !== slugifyString(environmentName)) {
    logger.error(`[APPLY-DETECTION] Invalid slugification of environmentName: ${environmentName}`)
    return
  }

  const [existingEnvironmentEntity] = await EntityService.getEntitiesByKeys(
    workspaceId,
    projectId,
    [environmentName],
    projectBranchId,
    EntityType.ENVIRONMENT,
  )

  if (existingEnvironmentEntity) {
    return
  }

  let versionService
  if (cookie) {
    versionService = new VersionService(cookie)
  } else {
    versionService = new InternalVersionService()
  }

  await versionService.createEntity({
    workspaceId,
    projectId,
    branchId: projectBranchId,
    payload: {
      key: environmentName,
      type: EntityType.ENVIRONMENT,
      path: '/',
      archived: false,
    },
  })
}

export const applyDependencyDetection = async (
  detection: IRadarDetection,
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  platformEntityId: string,
  cookie?: string,
  workspaceUserId?: string,
): Promise<void> => {
  const sourceComponentKey = slugifyString(detection.sourceComponentName as string)
  const targetComponentKey = slugifyString(detection.targetComponentName as string)

  if (
    !sourceComponentKey
    || !targetComponentKey
  ) {
    logger.error(
      { sourceComponentKey, targetComponentKey },
      '[applyDependencyDetection] Invalid dependency detection',
    )
    return
  }

  const sourceComponentEntity = await applyServiceDetection(
    {
      ...detection,
      componentName: sourceComponentKey,
    },
    workspaceId,
    projectId,
    projectBranchId,
    platformEntityId,
    cookie,
    workspaceUserId,
  )

  const targetComponentEntity = await applyServiceDetection(
    {
      ...detection,
      componentName: targetComponentKey,
    },
    workspaceId,
    projectId,
    projectBranchId,
    platformEntityId,
    cookie,
    workspaceUserId,
  )

  if (!sourceComponentEntity || !targetComponentEntity) {
    logger.error(
      {
        sourceComponentKey,
        targetComponentKey,
        workspaceId,
        projectId,
        detectionId: detection.id,
      },
      '[applyDependencyDetection] Source or target entity not found',
    )
    return
  }

  const platformDoc = await PlatformUtil.getPlatform(
    workspaceId,
    projectId,
    projectBranchId,
    platformEntityId,
  )

  const isEdgeExists = PlatformHelper.isEdgeExistsInPlatform(
    platformDoc,
    sourceComponentEntity.entityId.toString(),
    targetComponentEntity.entityId.toString(),
  )

  if (!isEdgeExists) {
    const vector = Y.encodeStateVector(platformDoc)
    const update = Y.encodeStateAsUpdate(PlatformHelper.addEdgeToPlatform(
      platformDoc,
      sourceComponentEntity.entityId.toString(),
      targetComponentEntity.entityId.toString(),
    ), vector)

    await shareEntityUpdate({
      workspaceId,
      projectId,
      entityId: platformEntityId,
      update,
      branchId: projectBranchId,
      workspaceUserId,
      entityType: EntityType.PLATFORM,
    })
  }

  return
}

// export const applyRestEndpointDetection = async (
//   cookie: string | undefined,
//   workspaceId: string,
//   projectId: string,
//   projectBranchId: string,
//   detection: IRadarDetection,
//   platformEntityId: string,
//   workspaceUserId?: string,
//   autoCreateComponents?: boolean,
// ): Promise<void> => {
//   const platformComponentEntity = await applyServiceDetection(
//     cookie,
//     workspaceId,
//     projectId,
//     projectBranchId,
//     detection,
//     platformEntityId,
//     workspaceUserId,
//     autoCreateComponents,
//   )

//   if (!platformComponentEntity) {
//     return
//   }

//   const projectBranchTree = await ProjectBranchModel.getProjectBranchTree(projectBranchId)

//   let openApiDoc = await ApiUtil.getExistingOpenApiDoc(
//     workspaceId,
//     projectId,
//     projectBranchTree.map(({ _id }) => _id),
//     platformComponentEntity.entityId,
//   )

//   if (!openApiDoc) {
//     if (!autoCreateComponents) {
//       return
//     }

//     openApiDoc = await ApiUtil.addOpenApiDoc(
//       cookie,
//       workspaceId,
//       projectId,
//       projectBranchId,
//       platformComponentEntity.entityId,
//       workspaceUserId,
//     )
//   }

//   const diff = ApiHelper.getDocumentAndPayloadDiff(
//     [detection],
//     openApiDoc.document,
//   )
//   const documentObject = openApiDoc.document.getMap('object')
//   const documentObjectJson = openApiDoc.document.getMap('object').toJSON()
//   const changesDoc = ApiHelper.convertDiffToOpenApiDoc(diff)
//   const mergedData = ApiHelper.mergeChangesWithCurrentDocument(documentObjectJson, changesDoc.object)
//   const diffPatch = ApiHelper.getDocumentDiffPatch(documentObjectJson, mergedData)

// const vector = Y.encodeStateVector(openApiDoc.document)
// openApiDoc.document.transact(()=>{
//   if (diffPatch?.paths) {
//     Object.keys(diffPatch.paths).forEach((key)=>{
//       ApiHelper.applyPatchToYDocumentObject(
//         'paths',
//         documentObject,
//         key,
//         diffPatch.paths[key],
//       )
//     })
//   }

//     if (diffPatch?.components) {
//       Object.keys(diffPatch.components).forEach((key)=>{
//         ApiHelper.applyPatchToYDocumentObject(
//           'components',
//           documentObject,
//           key,
//           diffPatch.paths[key],
//         )
//       })
//     }
//   })

// await shareEntityUpdate({
//   workspaceId,
//   projectId,
//   entityId: openApiDoc.entityId,
//   update: Y.encodeStateAsUpdate(openApiDoc.document, vector),
//   branchId: projectBranchId,
//   workspaceUserId,
//   entityType: EntityType.API,
// })
// }

export const applyServiceDetection = async (
  detection: IRadarDetection,
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  platformEntityId?: string,
  cookie?: string,
  workspaceUserId?: string,
): Promise<IEntity | undefined> => {
  let [componentEntity] = await EntityService.getComponentsByKeys(
    workspaceId,
    projectId,
    projectBranchId,
    [slugifyString(detection?.componentName as string)],
  )

  if (!componentEntity) {
    let versionService
    if (cookie) {
      versionService = new VersionService(cookie)
    } else {
      versionService = new InternalVersionService()
    }

    const createdEntity = await versionService.createEntity({
      workspaceId,
      projectId,
      branchId: projectBranchId,
      payload: {
        key: detection.componentName,
        type: EntityType.PLATFORM_COMPONENT,
        path: '/',
        archived: false,
        hostnames: detection.hostname ? [detection.hostname] : [],
      },
    })
    componentEntity = createdEntity.entity
  }

  if (platformEntityId) {
    const platformDoc = await PlatformUtil.getPlatform(
      workspaceId,
      projectId,
      projectBranchId,
      platformEntityId,
    )

    const isAddedToPlatform = PlatformHelper.isComponentAddedToPlatform(
      platformDoc,
      componentEntity.entityId.toString(),
    )

    if (!isAddedToPlatform) {
      const vector = Y.encodeStateVector(platformDoc)
      const update = Y.encodeStateAsUpdate(
        PlatformHelper.addComponentToPlatform(
          platformDoc,
          componentEntity.entityId.toString(),
          componentEntity.entityId.toString(),
        ),
        vector,
      )

      const versionService = new InternalVersionService()
      await versionService.createLink(
        {
          workspaceId,
          projectId,
          projectBranchId,
          sourceEntityId: platformEntityId,
          targetEntityId: componentEntity.entityId.toString(),
        },
      )

      await shareEntityUpdate({
        workspaceId,
        projectId,
        entityId: platformEntityId,
        update,
        branchId: projectBranchId,
        workspaceUserId,
        entityType: EntityType.PLATFORM,
      })
    }
  }

  return componentEntity as any as IEntity
}

export const applyDetection = async (
  detection: IRadarDetection,
  projectBranchId: string,
  workspaceId?: string,
  projectId?: string,
  platformEntityId?: string,
  cookie?: string,
  workspaceUserId?: string,
) => {
  const _workspaceId = workspaceId || detection.workspaceId
  const _projectId = projectId || detection.projectId

  if (
    !projectBranchId
    || !detection
    || !_workspaceId
    || !_projectId
  ) {
    logger.error('[applyDependencyDetection] Invalid arguments for applying detection')
    return
  }

  if (detection.type === RadarDetectionType.ENVIRONMENT) {
    await applyEnvironmentDetection(
      detection,
      _workspaceId,
      _projectId,
      projectBranchId,
      cookie,
    )
  } else if (detection.type === RadarDetectionType.DEPENDENCY) {
    if (!platformEntityId) {
      logger.error(`[applyDependencyDetection] Invalid arguments for ${detection.type} applying detection`)
      return
    }

    await applyDependencyDetection(
      detection,
      _workspaceId,
      _projectId,
      projectBranchId,
      platformEntityId,
      cookie,
      workspaceUserId,
    )
  } else if (detection.type === RadarDetectionType.SERVICE) {
    await applyServiceDetection(
      detection,
      _workspaceId,
      _projectId,
      projectBranchId,
      platformEntityId,
      cookie,
      workspaceUserId,
    )
  }
  // else if (detection.type === RadarDetectionType.ENDPOINT) {
  //   await applyRestEndpointDetection(
  //     cookie,
  //     _workspaceId,
  //     _projectId,
  //     projectBranchId,
  //     detection,
  //     platformEntityId,
  //     workspaceUserId,
  //     autoCreateComponents,
  //   )
  // }
}

const unapplyDependencyDetections = async (
  workspaceId,
  projectId,
  projectBranch: IProjectBranchDocument,
  detections: IRadarDetection[],
  workspaceUserId: string,
) => {
  for await (const platformEntity of EntityModel.getEntitiesInProjectCursor(
    workspaceId,
    projectId,
    {
      projectBranch: projectBranch._id,
      type: EntityType.PLATFORM,
      typeOfChangeInBranch: { $ne: EntityCommitChangeType.DELETE },
      deletedAtCommit: { $exists: false },
    },
  )) {
    try {
      const platformDoc = await PlatformUtil.getPlatform(
        workspaceId,
        projectId,
        projectBranch._id.toString(),
        platformEntity.entityId,
      )

      const updates: any[] = []

      for (const detection of detections) {
        const sourceComponentKey = detection.sourceComponentName as string
        const targetComponentKey = detection.targetComponentName as string

        if (
          !sourceComponentKey
          || !targetComponentKey
        ) {
          logger.error(
            {
              sourceComponentKey,
              targetComponentKey,
            },
            '[DETECTION-UNAPPLY] Invalid dependency detection',
          )
          continue
        }

        const sourceComponentEntity = await EntityModel.getEntityInBranchByKey(
          sourceComponentKey,
          projectBranch._id,
          {
            workspace: detection.workspaceId,
            project: detection.projectId,
          },
        )

        const targetComponentEntity = await EntityModel.getEntityInBranchByKey(
          targetComponentKey,
          projectBranch._id,
          {
            workspace: detection.workspaceId,
            project: detection.projectId,
          },
        )

        if (!sourceComponentEntity || !targetComponentEntity) {
          continue
        }

        let isEdgeExists = false

        try {
          isEdgeExists = PlatformHelper.isEdgeExistsInPlatform(
            platformDoc,
            sourceComponentEntity.entityId.toString(),
            targetComponentEntity.entityId.toString(),
          )
        } catch {
          isEdgeExists = false
        }

        if (isEdgeExists) {
          const vector = Y.encodeStateVector(platformDoc)
          const update = Y.encodeStateAsUpdate(
            PlatformHelper.removeEdgeFromPlatform(
              platformDoc,
              sourceComponentEntity.entityId.toString(),
              targetComponentEntity.entityId.toString(),
            ),
            vector,
          )

          updates.push(update)
        }
      }

      await shareEntityUpdate({
        workspaceId: workspaceId,
        projectId: projectId,
        entityId: platformEntity.entityId,
        update: Y.mergeUpdates(updates),
        branchId: projectBranch._id.toString(),
        workspaceUserId,
        entityType: EntityType.PLATFORM,
      })
    } catch (error) {
      logger.error(
        error,
        {
          workspace: workspaceId,
          project: projectId,
          branch: projectBranch._id.toString(),
          platformEntityId: platformEntity.entityId.toString(),
        },
        '[DETECTION-UNAPPLY] Failed to unapply dependency from platform',
      )
    }
  }
}

const unapplyServiceDetection = async (
  workspaceId,
  projectId,
  projectBranch: IProjectBranchDocument,
  detection: IRadarDetection,
  cookie: string,
) => {
  const componentEntity = await EntityModel.getEntityInBranchByKey(
    detection.componentName as string,
    projectBranch._id,
    {
      workspace: workspaceId,
      project: projectId,
    },
  )

  const versionService = new VersionService(cookie)

  if (!componentEntity) {
    logger.error({
      detectionId: detection.id,
      componentName: detection.componentName,
      workspace: detection.workspaceId,
      project: detection.projectId,
    }, '[DETECTION-UNAPPLY] Component entity not found')
    return
  }

  if (detection.componentAliasName) {
    await versionService.updateEntity({
      workspaceId,
      projectId,
      branchId: projectBranch._id.toString(),
      entityId: componentEntity.entityId.toString(),
      payload: {
        keyAliases: componentEntity.keyAliases
          .filter(alias => alias !== detection.componentName),
      },
    })
  } else {
    await versionService.deleteEntity({
      workspaceId,
      projectId,
      branchId: projectBranch._id.toString(),
      entityId: componentEntity.entityId.toString(),
    })
  }
}

const unapplyEnvironmentDetection = async (
  workspaceId,
  projectId,
  projectBranch: IProjectBranchDocument,
  detection: IRadarDetection,
  cookie: string,
) => {
  const componentEntity = await EntityModel.getEntityInBranchByKey(
    detection.environmentName as string,
    projectBranch._id,
    {
      workspace: workspaceId,
      project: projectId,
    },
  )

  const versionService = new VersionService(cookie)

  await versionService.deleteEntity({
    workspaceId: workspaceId,
    projectId: projectId,
    branchId: projectBranch._id.toString(),
    entityId: componentEntity.entityId.toString(),
  })
}

export const unapplyDetections = async (
  workspaceId: string,
  projectId: string,
  filter: {
    ids?: string[],
    type?: RadarDetectionType,
  },
  workspaceUserId: string,
  cookie: string,
) => {
  const defaultBranch = await ProjectBranchModel.getDefaultProjectBranch(projectId)

  if (!defaultBranch) {
    throw new Error('Default branch not found')
  }

  if (filter.type) {
    const detections = await RadarDetectionService.listDetections({
      workspaceId,
      projectId,
      type: filter.type,
      Sign: RadarDetectionSource.DOCS,
    }) as IRadarDetection[]

    if (filter.type === RadarDetectionType.ENDPOINT) {
      return
    } else if (filter.type === RadarDetectionType.DEPENDENCY) {
      await unapplyDependencyDetections(
        workspaceId,
        projectId,
        defaultBranch,
        detections,
        workspaceUserId,
      )
    } else if (filter.type === RadarDetectionType.SERVICE) {
      await Promise.allSettled(detections.map(detection => unapplyServiceDetection(
        workspaceId,
        projectId,
        defaultBranch,
        detection,
        cookie,
      )))
    } else if (filter.type === RadarDetectionType.ENVIRONMENT) {
      await Promise.allSettled(detections.map(detection => unapplyEnvironmentDetection(
        workspaceId,
        projectId,
        defaultBranch,
        detection,
        cookie,
      )))
    }
  } else if (filter.ids) {
    for (const detectionId of filter.ids) {
      const detection = await RadarDetectionService.getDetectionById(detectionId)

      if (!detection) {
        continue
      }

      if (detection.type === RadarDetectionType.DEPENDENCY) {
        await unapplyDependencyDetections(
          workspaceId,
          projectId,
          defaultBranch,
          [detection],
          workspaceUserId,
        )
      } else if (detection.type === RadarDetectionType.SERVICE) {
        await unapplyServiceDetection(
          workspaceId,
          projectId,
          defaultBranch,
          detection,
          cookie,
        )
      } else if (detection.type === RadarDetectionType.ENVIRONMENT) {
        await unapplyEnvironmentDetection(
          workspaceId,
          projectId,
          defaultBranch,
          detection,
          cookie,
        )
      }
    }
  }
}
