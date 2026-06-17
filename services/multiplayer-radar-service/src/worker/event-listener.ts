import {
  EntityModel,
  IEntityDocument,
  ProjectLinkModel,
} from '@multiplayer/models'
import logger from '@multiplayer/logger'
import {
  IRadarDetection,
  RadarDetectionSource,
  RadarDetectionType,
  CollaborationAMQPMessageType,
  EntityType,
  EntityCommitChangeType,
  EntityCommitMessage,
  EntityDeletedMessage,
  EntityCreatedMessage,
  EntityUpdatedMessage,
  IntegrationUpdateMessage,
  ProjectLinkObjectType,
  IRadarDetectionParam,
  IEntity,
  HttpMethod,
  RadarDetectionParamDirection,
  RadarDetectionParamSource,
  ProjectLinkDeletedMessage,
  RadarDetectionEndpointType,
} from '@multiplayer/types'
import {
  PlatformHelper,
  ApiHelper,
  EntityUtil,
} from '@multiplayer/entity'
import { ObjectId } from '@multiplayer/mongo'
import {
  RadarDetectionLib,
} from '../libs'
import { PlatformUtil, ApiUtil } from '../util'
import {
  RadarDetectionService,
  ProjectBranchService,
} from '../services'

// const autoApplyRadarDetectionOnIntegrationUpdate = async (message: { variables: IntegrationUpdateMessage }) => {
//   const {
//     integrationId,
//   } = message.variables
//   await IntegrationLib.addNotAppliedDetectionsToAutoMergeQueue(integrationId)
// }

const handleOpenApiDocChange = async (
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  apiDocEntityId: string,
) => {
  if (!apiDocEntityId) {
    return
  }
  const { data: [apiLink] } = await ProjectLinkModel.getProjectLinkState(
    [new ObjectId(projectBranchId)],
    {
      sourceObjectType: ProjectLinkObjectType.Entity,
      targetObjectType: ProjectLinkObjectType.Entity,
      sourceEntityType: EntityType.API,
      sourceObjectId: new ObjectId(apiDocEntityId),
    },
  )

  if (!apiLink) {
    logger.warn({ apiDocEntityId }, '[EVENT-LISTENER] Missing api link')
    return
  }

  const component = apiLink.targetObject as any as IEntity
  const componentNames = [
    component.key,
    ...component.keyAliases || [],
  ].map(name => name.toLowerCase())

  const apiYDoc = await ApiUtil.getExistingOpenApiDoc(
    workspaceId,
    projectId,
    [new ObjectId(projectBranchId)],
    component.entityId,
  )

  await RadarDetectionService.deleteParamDetections({
    workspaceId,
    projectId,
    Sign: RadarDetectionSource.DOCS,
    entityId: component.entityId.toString(),
  })

  if (!apiYDoc) {
    return
  }

  const apiDocument = ApiHelper.getDocumentJson(apiYDoc.document)

  if (!apiDocument) {
    return
  }

  const detectionHttpParam: IRadarDetectionParam[] = []
  const detections: IRadarDetection[] = []

  let serverPrefixes: string[] = apiDocument.servers
    ?.map(({ url }) => url)
    .filter(Boolean) as string[]

  if (!serverPrefixes?.length) {
    serverPrefixes = ['']
  }

  for (const serverPrefix of serverPrefixes) {
    for (const httpEndpoint in apiDocument?.paths || {}) {
      for (const httpMethod in apiDocument.paths[httpEndpoint] || {}) {
        const httpEndpointWithPrefix = `${serverPrefix}${httpEndpoint}`
        const methodObject = apiDocument.paths?.[httpEndpoint]?.[httpMethod]
        const requestSchema = EntityUtil.getNestedProperty(
          methodObject,
          [
            'requestBody',
            'content',
            'application/json',
            'schema',
          ],
        )

        for (const [componentNameIndex, componentName] of componentNames.entries()) {
          const endpointDetection: Omit<IRadarDetection, 'id' | 'collapse_id'> & { id?: string, collapse_id?: string } = {
            Sign: RadarDetectionSource.DOCS,
            workspaceId,
            projectId,
            entityId: component.entityId,
            type: RadarDetectionType.ENDPOINT,
            componentName,
            componentAliasName: componentNameIndex !== 0,
            httpMethod: httpMethod.toUpperCase() as HttpMethod,
            httpEndpoint: httpEndpointWithPrefix,
            endpointType: RadarDetectionEndpointType.HTTP,
            Timestamp: new Date(),
          }
          endpointDetection.id = RadarDetectionLib.getDetectionId(endpointDetection)
          endpointDetection.collapse_id = RadarDetectionLib.getDetectionCollapseId(
            RadarDetectionSource.RADAR,
            endpointDetection,
          )
          endpointDetection.mainRefId = RadarDetectionLib.getDetectionId({
            ...endpointDetection,
            componentName: componentNames[0],
          })

          detections.push(endpointDetection as IRadarDetection)

          for (const reqParameter of (methodObject?.parameters || [])) {
            if (reqParameter.in === 'path') {
              continue
            }
            const httpReqParams = RadarDetectionLib.formatRadarDetecitonParamsPayload(
              [{
                paramPath: reqParameter.name,
                paramType: reqParameter.type,
                paramFormat: undefined,
                paramSource: RadarDetectionParamSource.QUERY,
              }],
              {
                Sign: RadarDetectionSource.DOCS,
                endpointId: endpointDetection.id,
                workspaceId,
                projectId,
                entityId: component.entityId.toString(),
                componentName,
                componentAliasName: componentNameIndex !== 0,
                endpointType: RadarDetectionEndpointType.HTTP,
                httpMethod: httpMethod.toUpperCase() as HttpMethod,
                httpEndpoint: httpEndpointWithPrefix,
                paramDirection: RadarDetectionParamDirection.REQUEST,
              },
              RadarDetectionSource.DOCS,
            )

            detectionHttpParam.push(...httpReqParams)
          }


          if (requestSchema) {
            const requestSchemaObject = ApiHelper.getFullSchema(requestSchema, apiDocument)

            const _httpParams = RadarDetectionLib.getHttpBodyParams(requestSchemaObject)

            const httpParamAdditionalPayload = {
              Sign: RadarDetectionSource.DOCS,
              endpointId: endpointDetection.id,
              mainRefId: RadarDetectionLib.getDetectionId({
                ...endpointDetection,
                componentName: componentNames[0],
              }),
              workspaceId,
              projectId,
              entityId: component.entityId.toString(),
              componentName,
              componentAliasName: componentNameIndex !== 0,
              httpMethod: httpMethod.toUpperCase() as HttpMethod,
              httpEndpoint: httpEndpointWithPrefix,
              paramDirection: RadarDetectionParamDirection.REQUEST,
              endpointType: RadarDetectionEndpointType.HTTP,
              Timestamp: new Date(),
            }

            const httpReqBodyParams = RadarDetectionLib.formatRadarDetecitonParamsPayload(
              _httpParams,
              {
                ...httpParamAdditionalPayload,
                paramDirection: RadarDetectionParamDirection.REQUEST,
              },
              RadarDetectionSource.DOCS,
            )

            detectionHttpParam.push(...httpReqBodyParams)
          }


          for (const httpStatus in methodObject?.responses || {}) {
            if (httpStatus === 'default') {
              continue
            }

            const responseSchema = EntityUtil.getNestedProperty(methodObject.responses, [
              httpStatus,
              'content',
              'application/json',
              'schema',
            ])

            if (!responseSchema) {
              continue
            }

            const responseSchemaObject = ApiHelper.getFullSchema(responseSchema, apiDocument)
            const _httpResBodyParams = RadarDetectionLib.getHttpBodyParams(responseSchemaObject)

            const httpParamAdditionalPayload = {
              Sign: RadarDetectionSource.DOCS,
              endpointId: endpointDetection.id,
              mainRefId: endpointDetection.mainRefId,
              workspaceId,
              projectId,
              entityId: component.entityId.toString(),
              componentName,
              componentAliasName: componentNameIndex !== 0,
              httpMethod: httpMethod.toUpperCase() as HttpMethod,
              httpEndpoint: httpEndpointWithPrefix,
              httpStatus: Number(httpStatus),
              paramDirection: RadarDetectionParamDirection.RESPONSE,
              endpointType: RadarDetectionEndpointType.HTTP,
              Timestamp: new Date(),
            }

            const httpResBodyParams = RadarDetectionLib.formatRadarDetecitonParamsPayload(
              _httpResBodyParams,
              {
                ...httpParamAdditionalPayload,
                paramDirection: RadarDetectionParamDirection.RESPONSE,
              },
              RadarDetectionSource.DOCS,
            )

            detectionHttpParam.push(...httpResBodyParams)
          }

        }
      }
    }
  }

  await RadarDetectionService.createRadarDetectionHttpParams(detectionHttpParam)
  await RadarDetectionService.createDetections(detections)
}

const handlePlatformCreate = async (message: { variables: EntityCreatedMessage }) => {
  const isDefaultBranch = message.variables.isDefaultBranch
  const workspaceId = message.variables.entity.workspace
  const projectId = message.variables.entity.project
  const platformEntityId = message?.variables.entity.entityId
  const projectBranchId = message?.variables?.entityCommit.projectBranch

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !platformEntityId
    || !projectBranchId
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handlePlatformUpdate')
    return
  }

  const projectIdFromBranch = await ProjectBranchService.getProjectIdByBranchById(projectBranchId)
  if (!projectIdFromBranch || projectIdFromBranch !== projectId) {
    logger.error({
      projectIdFromBranch,
      projectId,
    }, '[EVENT-HANDLER] Invalid project branch id')
    return
  }

  const platform = await PlatformUtil.getPlatform(
    workspaceId,
    projectId,
    projectBranchId,
    platformEntityId,
  )

  const dependenciesBetweenComponents = PlatformHelper.getEdgesInPlatform(platform)

  const platformComponentIds = [...new Set(dependenciesBetweenComponents.flatMap(dependency => ([
    dependency.sourceComponentId,
    dependency.targetComponentId,
  ])))] as string[]

  const platformComponents = await EntityModel.getEntitiesInBranchByEntityIds(
    platformComponentIds,
    projectBranchId,
  )
  const platformComponentsMapping = platformComponents.reduce(
    (
      acc: { [key: string]: IEntityDocument },
      entity,
    ) => ({
      ...acc,
      [entity.entityId.toString()]: entity,
    }),
    {},
  )

  await RadarDetectionService.deleteDetections({
    workspaceId,
    projectId,
    Sign: RadarDetectionSource.DOCS,
    type: RadarDetectionType.DEPENDENCY,
    platformId: platformEntityId,
  })

  const detections: IRadarDetection[] = dependenciesBetweenComponents.flatMap(dependency => {
    const sourceComponent = platformComponentsMapping[dependency.sourceComponentId]
    const targetComponent = platformComponentsMapping[dependency.targetComponentId]

    if (!sourceComponent || !targetComponent) {
      return []
    }

    const sourceComponentNames = [
      sourceComponent.key,
      ...(sourceComponent.keyAliases || []),
    ].map(name => name.toLowerCase())

    const targetComponentNames = [
      targetComponent.key,
      ...(targetComponent.keyAliases || []),
    ].map(name => name.toLowerCase())

    const _detections: IRadarDetection[] = sourceComponentNames.flatMap((sourceComponentKey, sourceComponentKeyIndex) =>
      targetComponentNames.map((targetComponentKey, targetComponentKeyIndex) => {
        const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
          Sign: RadarDetectionSource.DOCS,
          workspaceId,
          projectId,
          type: RadarDetectionType.DEPENDENCY,
          sourceComponentName: sourceComponentKey,
          sourceEntityId: sourceComponent.entityId?.toString(),
          targetComponentName: targetComponentKey,
          targetEntityId: targetComponent.entityId?.toString(),
          componentAliasName: targetComponentKeyIndex !== 0 && sourceComponentKeyIndex !== 0,
          Timestamp: new Date(),
        }

        return {
          ...detection,
          id: RadarDetectionLib.getDetectionId(detection),
          collapse_id: RadarDetectionLib.getDetectionCollapseId(
            RadarDetectionSource.DOCS,
            detection,
          ),
        }
      }),
    )

    return _detections
  })

  await RadarDetectionService.createDetections(detections)
}

const handlePlatformUpdate = async (message: { variables: EntityCommitMessage }) => {
  const isDefaultBranch = message.variables.isDefaultBranch
  const workspaceId = message.variables.workspaceId
  const projectId = message.variables.projectId
  const platformEntityId = message?.variables?.entityId
  const projectBranchId = message?.variables?.branchId

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !platformEntityId
    || !projectBranchId
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handlePlatformUpdate')
    return
  }

  const projectIdFromBranch = await ProjectBranchService.getProjectIdByBranchById(projectBranchId)
  if (!projectIdFromBranch || projectIdFromBranch !== projectId) {
    logger.error({
      projectIdFromBranch,
      projectId,
    }, '[EVENT-HANDLER] Invalid project branch id')
    return
  }

  await RadarDetectionService.deleteDetections({
    workspaceId,
    projectId,
    platformId: platformEntityId,
    Sign: RadarDetectionSource.DOCS,
    type: {
      $or: [RadarDetectionType.DEPENDENCY, RadarDetectionType.SERVICE],
    },
  })

  const platform = await PlatformUtil.getPlatform(
    workspaceId,
    projectId,
    projectBranchId,
    platformEntityId,
  )

  const componentEntityIdsInPlatform = PlatformHelper.getComponentsInPlatform(platform, true)

  const dependenciesBetweenComponents = PlatformHelper.getEdgesInPlatform(platform, true)

  // const platformComponentIds = [...new Set(dependenciesBetweenComponents.flatMap(dependency => ([
  //   dependency.sourceComponentId,
  //   dependency.targetComponentId,
  // ])))] as string[]

  const platformComponents = await EntityModel.getEntitiesInBranchByEntityIds(
    componentEntityIdsInPlatform,
    projectBranchId,
  )

  const platformComponentsMapping = platformComponents.reduce(
    (
      acc: { [key: string]: IEntityDocument },
      entity,
    ) => ({
      ...acc,
      [entity.entityId.toString()]: entity,
    }),
    {},
  )

  const componentDetections: IRadarDetection[] = []

  for (const componentEntityIdInPlatform of componentEntityIdsInPlatform) {
    const componentEntityInPlatform = platformComponents.find(({ entityId }) => entityId.equals(componentEntityIdInPlatform))

    if (!componentEntityInPlatform) {
      logger.error({ componentEntityIdInPlatform }, '[EVENT-HANDLER] Failed to find component from platform')
      continue
    }

    const componentNames = [
      componentEntityInPlatform.key,
      ...(componentEntityInPlatform.keyAliases || []),
    ].map(name => name.toLowerCase())

    for (const [componentNameIndex, componentName] of componentNames.entries()) {
      const sourceComponentDetection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
        Sign: RadarDetectionSource.DOCS,
        workspaceId,
        projectId,
        platformId: platformEntityId,
        entityId: componentEntityInPlatform.entityId.toString(),
        type: RadarDetectionType.SERVICE,
        componentName,
        componentAliasName: componentNameIndex !== 0,
        tags: componentEntityInPlatform.tags?.map(tag => [tag.key || '', tag.value || '']) || [],
        Timestamp: new Date(),
      }

      componentDetections.push({
        ...sourceComponentDetection,
        id: RadarDetectionLib.getDetectionId(sourceComponentDetection),
        collapse_id: RadarDetectionLib.getDetectionCollapseId(
          RadarDetectionSource.DOCS,
          sourceComponentDetection,
        ),
        mainRefId: RadarDetectionLib.getDetectionId({
          ...sourceComponentDetection,
          componentName: componentNames[0],
        }),
      })
    }
  }

  const dependencyDetections: IRadarDetection[] = dependenciesBetweenComponents.flatMap(dependency => {
    const sourceComponent = platformComponentsMapping[dependency.sourceComponentId]
    const targetComponent = platformComponentsMapping[dependency.targetComponentId]

    if (!sourceComponent || !targetComponent) {
      return []
    }

    const sourceComponentNames = [
      sourceComponent.key,
      ...(sourceComponent.keyAliases || []),
    ].map(name => name.toLowerCase())

    const targetComponentNames = [
      targetComponent.key,
      ...(targetComponent.keyAliases || []),
    ].map(name => name.toLowerCase())

    const _detections: IRadarDetection[] = sourceComponentNames.flatMap((sourceComponentKey, sourceComponentKeyIndex) =>
      targetComponentNames.flatMap((targetComponentKey, targetComponentKeyIndex) => {
        const dependencyDetection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
          Sign: RadarDetectionSource.DOCS,
          workspaceId,
          projectId,
          platformId: platformEntityId,
          type: RadarDetectionType.DEPENDENCY,
          sourceEntityId: sourceComponent.entityId?.toString(),
          sourceComponentName: sourceComponentKey,
          targetEntityId: targetComponent.entityId?.toString(),
          targetComponentName: targetComponentKey,
          componentAliasName: targetComponentKeyIndex !== 0 && sourceComponentKeyIndex !== 0,
          Timestamp: new Date(),
        }


        return {
          ...dependencyDetection,
          id: RadarDetectionLib.getDetectionId(dependencyDetection),
          collapse_id: RadarDetectionLib.getDetectionCollapseId(
            RadarDetectionSource.DOCS,
            dependencyDetection,
          ),
        }
      }),
    )

    return _detections
  })

  await RadarDetectionService.createDetections([
    ...dependencyDetections,
    ...componentDetections,
  ])
}

const handlePlatformDelete = async (message: { variables: EntityDeletedMessage }) => {
  const isDefaultBranch = message.variables.isDefaultBranch
  const workspaceId = message.variables.workspaceId
  const projectId = message.variables.projectId
  const platformEntityId = message?.variables?.entityId
  const projectBranchId = message?.variables?.branchId

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !platformEntityId
    || !projectBranchId
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handlePlatformDelete')
    return
  }

  await RadarDetectionService.deleteDetections({
    workspaceId,
    projectId,
    platformId: platformEntityId,
    Sign: RadarDetectionSource.DOCS,
    type: RadarDetectionType.DEPENDENCY,
  })
}

const handleApiCreate = async (message: { variables: EntityCreatedMessage }) => {
  const isDefaultBranch = message?.variables?.isDefaultBranch
  const workspaceId = message?.variables?.entity?.workspace
  const projectId = message?.variables?.entity?.project
  const projectBranchId = message?.variables?.entityCommit.projectBranch
  const entityId = message?.variables?.entity.entityId

  if (
    !isDefaultBranch
    || !isDefaultBranch
    || !workspaceId
    || !projectId
    || !projectBranchId
    || !entityId
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handleApiCreate')
    return
  }

  setTimeout(async () => {
    await handleOpenApiDocChange(
      workspaceId,
      projectId,
      projectBranchId,
      entityId,
    )
  }, 2000)
}

const handleApiUpdate = async (message: { variables: EntityCommitMessage }) => {
  const isDefaultBranch = message.variables.isDefaultBranch
  const workspaceId = message.variables.workspaceId
  const projectId = message.variables.projectId
  const entityId = message?.variables?.entity?.entityId
  const projectBranchId = message?.variables?.entityCommit.projectBranch

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !entityId
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handleApiUpdate')
    return
  }

  await handleOpenApiDocChange(
    workspaceId,
    projectId,
    projectBranchId,
    entityId,
  )

  return
}

const handleApiDelete = async (message: { variables: ProjectLinkDeletedMessage }) => {
  const isDefaultBranch = message.variables.isDefaultBranch
  const workspaceId = message.variables.workspaceId
  const projectId = message.variables.projectId
  const entityId = message?.variables?.targetObjectId
  const sourceEntityType = message?.variables?.sourceEntityType
  const targetEntityType = message?.variables?.targetEntityType
  const projectBranchId = message?.variables?.branchId

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !entityId
    || !projectBranchId
    || targetEntityType !== EntityType.PLATFORM_COMPONENT
    || sourceEntityType !== EntityType.API
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handleApiDelete')
    return
  }

  const platformComponent = await EntityModel.getEntityInBranchByEntityId(
    entityId,
    projectBranchId,
  )

  if (!platformComponent) {
    return
  }

  await RadarDetectionService.deleteParamDetections({
    workspaceId,
    projectId,
    entityId,
    Sign: RadarDetectionSource.DOCS,
  })
}

const handlePlatformComponentCreate = async (message: { variables: EntityCreatedMessage }) => {
  const isDefaultBranch = message?.variables?.isDefaultBranch
  const workspaceId = message?.variables?.entity?.workspace
  const projectId = message?.variables?.entity?.project
  const entityId = message?.variables?.entity.entityId
  const entityName = message?.variables?.entityCommit?.meta?.entityName || message?.variables?.entity?.key
  const keyAliases = message?.variables?.entity?.keyAliases || []
  const tags = message?.variables?.entity?.tags || []
  const formattedTags = tags.map(tag => [tag.key || '', tag.value || '']) as [string, string][] || []

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !entityId
    || !entityName
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handlePlatformComponentCreate')
    return
  }

  const componentNames = [
    entityName,
    ...keyAliases,
  ].map(name => name.toLowerCase())

  const detections: IRadarDetection[] = []

  for (const [componentNameIndex, componentName] of componentNames.entries()) {
    const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
      Sign: RadarDetectionSource.DOCS,
      workspaceId,
      projectId,
      entityId,
      type: RadarDetectionType.SERVICE,
      componentName,
      componentAliasName: componentNameIndex !== 0,
      tags: formattedTags,
      Timestamp: new Date(),
    }

    detections.push({
      ...detection,
      id: RadarDetectionLib.getDetectionId(detection),
      collapse_id: RadarDetectionLib.getDetectionCollapseId(
        RadarDetectionSource.DOCS,
        detection,
      ),
      mainRefId: RadarDetectionLib.getDetectionId({
        ...detection,
        componentName: componentNames[0],
      }),
    })
  }

  await RadarDetectionService.createDetections(detections)
}

const handlePlatformComponentUpdate = async (message: {
  variables: EntityCommitMessage | EntityUpdatedMessage
}) => {
  const isDefaultBranch = message?.variables?.isDefaultBranch
  const workspaceId = message?.variables?.entity?.workspace
  const projectId = message?.variables?.entity?.project
  const entityId = message?.variables?.entity?.entityId
  const entityName = message?.variables?.entity?.key
  const projectBranchId = message?.variables?.branchId
  const keyAliases = message?.variables?.entity?.keyAliases || []
  const tags = message?.variables?.entity?.tags || []
  const formattedTags = tags.map(tag => [tag.key || '', tag.value || '']) as [string, string][] || []

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !entityId
    || !entityName
    || !projectBranchId
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handlePlatformComponentUpdate')
    return
  }

  await RadarDetectionService.deleteDetections({
    workspaceId,
    projectId,
    entityId,
    Sign: RadarDetectionSource.DOCS,
    // type: RadarDetectionType.SERVICE,
  })

  const projectIdFromBranch = await ProjectBranchService.getProjectIdByBranchById(projectBranchId)
  if (!projectIdFromBranch || projectIdFromBranch !== projectId) {
    logger.error({
      projectIdFromBranch,
      projectId,
    }, '[EVENT-HANDLER] Invalid project branch id')
    return
  }

  const componentNames = [
    entityName,
    ...keyAliases,
  ].map(name => name.toLowerCase())

  const detections: IRadarDetection[] = []

  for (const [componentNameIndex, componentName] of componentNames.entries()) {
    const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
      Sign: RadarDetectionSource.DOCS,
      workspaceId,
      projectId,
      entityId,
      type: RadarDetectionType.SERVICE,
      componentName,
      componentAliasName: componentNameIndex !== 0,
      tags: formattedTags,
      Timestamp: new Date(),
    }

    detections.push({
      ...detection,
      id: RadarDetectionLib.getDetectionId(detection),
      collapse_id: RadarDetectionLib.getDetectionCollapseId(
        RadarDetectionSource.DOCS,
        detection,
      ),
      mainRefId: RadarDetectionLib.getDetectionId({
        ...detection,
        componentName: componentNames[0],
      }),
    })
  }

  await RadarDetectionService.createDetections(detections)

  // update apis for that component
  const { data: apiLinks } = await ProjectLinkModel.getProjectLinkState(
    [new ObjectId(projectBranchId)],
    {
      sourceObjectType: ProjectLinkObjectType.Entity,
      targetObjectType: ProjectLinkObjectType.Entity,
      sourceEntityType: EntityType.API,
      targetObjectId: new ObjectId(entityId),
    },
  )

  for (const apiLink of apiLinks) {
    await handleOpenApiDocChange(
      workspaceId,
      projectId,
      projectBranchId,
      apiLink.sourceEntityType === EntityType.API
        ? apiLink.sourceObject.entityId || apiLink.sourceObject
        : apiLink.targetObject.entityId || apiLink.targetObject,
    )
  }

  // update dependencies for that component
  await RadarDetectionService.deleteDetections({
    workspaceId,
    projectId,
    Sign: RadarDetectionSource.DOCS,
    sourceEntityId: entityId,
  })
  await RadarDetectionService.deleteDetections({
    workspaceId,
    projectId,
    Sign: RadarDetectionSource.DOCS,
    targetEntityId: entityId,
  })

  const { data: platformLinks } = await ProjectLinkModel.getProjectLinkState(
    [new ObjectId(projectBranchId)],
    {
      sourceObjectType: ProjectLinkObjectType.Entity,
      sourceEntityType: EntityType.PLATFORM_COMPONENT,
      sourceObjectId: entityId,
      targetObjectType: ProjectLinkObjectType.Entity,
      targetEntityType: EntityType.PLATFORM,
    },
  )

  for (const platformLink of platformLinks) {
    let platformId

    if (platformLink.targetEntityType === EntityType.PLATFORM) {
      platformId = (platformLink.targetObject as any)?.entityId?.toString()
    } else if (platformLink.sourceEntityType === EntityType.PLATFORM) {
      platformId = (platformLink.sourceObject as any)?.entityId?.toString()
    }

    if (!platformId) {
      continue
    }

    await handlePlatformUpdate({
      variables: {
        isDefaultBranch,
        workspaceId,
        projectId,
        entityId: platformId,
        branchId: projectBranchId,
      } as any,
    })
  }
}

const handlePlatformComponentDelete = async (message: { variables: EntityDeletedMessage }) => {
  const isDefaultBranch = message.variables.isDefaultBranch
  const workspaceId = message.variables.workspaceId
  const projectId = message.variables.projectId
  const entityId = message.variables.entityId

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !entityId
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handlePlatformComponentDelete')
    return
  }

  await Promise.all([
    RadarDetectionService.deleteDetections({
      workspaceId,
      projectId,
      entityId,
      Sign: RadarDetectionSource.DOCS,
      type: RadarDetectionType.SERVICE,
    }),
    RadarDetectionService.deleteParamDetections({
      workspaceId,
      projectId,
      entityId,
      Sign: RadarDetectionSource.DOCS,
    }),
  ])
}

const handleEnvironmentCreate = async (message: { variables: EntityCreatedMessage }) => {
  const isDefaultBranch = message?.variables?.isDefaultBranch
  const workspaceId = message?.variables?.entity?.workspace
  const projectId = message?.variables?.entity?.project
  const entityId = message?.variables?.entity.entityId
  const entityName = message?.variables?.entityCommit?.meta?.entityName
  const keyAliases = message?.variables?.entity?.keyAliases || []
  const tags = message?.variables?.entity?.tags || []
  const formattedTags = tags.map(tag => [tag.key || '', tag.value || '']) as [string, string][] || []

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !entityId
    || !entityName
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handleEnvironmentCreate')
    return
  }

  const environmentNames = [
    entityName,
    ...keyAliases,
  ].map(name => name.toLowerCase())

  const detections: IRadarDetection[] = []

  for (const [environmentNameIndex, environmentName] of environmentNames.entries()) {
    const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
      Sign: RadarDetectionSource.DOCS,
      workspaceId,
      projectId,
      entityId,
      type: RadarDetectionType.ENVIRONMENT,
      environmentName,
      componentAliasName: environmentNameIndex !== 0,
      tags: formattedTags,
      Timestamp: new Date(),
    }

    detections.push({
      ...detection,
      id: RadarDetectionLib.getDetectionId(detection),
      mainRefId: RadarDetectionLib.getDetectionId({
        ...detection,
        environmentName: environmentNames[0],
      }),
      collapse_id: RadarDetectionLib.getDetectionCollapseId(
        RadarDetectionSource.DOCS,
        detection,
      ),
    })
  }

  await RadarDetectionService.createDetections(detections)
}

const handleEnvironmentUpdate = async (message: {
  variables: EntityCommitMessage | EntityUpdatedMessage
}) => {
  const isDefaultBranch = message?.variables?.isDefaultBranch
  const workspaceId = message?.variables?.entity?.workspace
  const projectId = message?.variables?.entity?.project
  const entityId = message?.variables?.entity?.entityId
  const entityName = message?.variables?.entity?.key
  const keyAliases = message?.variables?.entity?.keyAliases || []
  const tags = message?.variables?.entity?.tags || []
  const formattedTags = tags.map(tag => [tag.key || '', tag.value || '']) as [string, string][] || []

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !entityId
    || !entityName
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handleEnvironmentUpdate')
    return
  }

  await RadarDetectionService.deleteDetections({
    workspaceId,
    projectId,
    entityId,
    Sign: RadarDetectionSource.DOCS,
    type: RadarDetectionType.ENVIRONMENT,
  })

  const environmentNames = [
    entityName,
    ...keyAliases,
  ].map(name => name.toLowerCase())

  const detections: IRadarDetection[] = []
  for (const [environmentNameIndex, environmentName] of environmentNames.entries()) {
    const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
      Sign: RadarDetectionSource.DOCS,
      workspaceId,
      projectId,
      entityId,
      type: RadarDetectionType.ENVIRONMENT,
      environmentName,
      componentAliasName: environmentNameIndex !== 0,
      tags: formattedTags,
      Timestamp: new Date(),
    }

    detections.push({
      ...detection,
      id: RadarDetectionLib.getDetectionId(detection),
      collapse_id: RadarDetectionLib.getDetectionCollapseId(
        RadarDetectionSource.DOCS,
        detection,
      ),
      mainRefId: RadarDetectionLib.getDetectionId({
        ...detection,
        environmentName: environmentNames[0],
      }),
    })
  }

  await RadarDetectionService.createDetections(detections)
}

const handleEnvironmentDelete = async (message: { variables: EntityDeletedMessage }) => {
  const isDefaultBranch = message.variables.isDefaultBranch
  const workspaceId = message.variables.workspaceId
  const projectId = message.variables.projectId
  const entityId = message.variables.entityId

  if (
    !isDefaultBranch
    || !workspaceId
    || !projectId
    || !entityId
  ) {
    logger.error({ message }, '[EVENT-HANDLER] Invalid event format for handleEnvironmentDelete')
    return
  }

  await RadarDetectionService.deleteDetections({
    workspaceId,
    projectId,
    entityId,
    Sign: RadarDetectionSource.DOCS,
    type: RadarDetectionType.ENVIRONMENT,
  })
}

export const eventListener = async (eventMessage: any) => {
  if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_CREATE
    && eventMessage.variables?.entity?.type === EntityType.API
  ) {
    await handleApiCreate(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_COMMIT_CREATED
    && eventMessage.variables?.entity?.type === EntityType.API
  ) {
    await handleApiUpdate(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.PROJECT_LINK_DELETE
    && eventMessage.variables?.sourceEntityType === EntityType.API
    && eventMessage.variables?.targetEntityType === EntityType.PLATFORM_COMPONENT
  ) {
    await handleApiDelete(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_CREATE
    && eventMessage.variables?.entity?.type === EntityType.ENVIRONMENT
  ) {
    await handleEnvironmentCreate(eventMessage)
  } else if (
    (
      eventMessage.type === CollaborationAMQPMessageType.ENTITY_COMMIT_CREATED
      && eventMessage.variables?.entityCommit?.entityType === EntityType.ENVIRONMENT
      && eventMessage.variables?.entityCommit?.changeType === EntityCommitChangeType.UPDATE
    ) || (
      eventMessage.type === CollaborationAMQPMessageType.ENTITY_UPDATE
      && eventMessage.variables?.entity?.type === EntityType.ENVIRONMENT
    )
  ) {
    await handleEnvironmentUpdate(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_DELETE
    && eventMessage.variables?.entity?.type === EntityType.ENVIRONMENT
  ) {
    await handleEnvironmentDelete(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_CREATE
    && eventMessage.variables?.entity?.type === EntityType.PLATFORM_COMPONENT
  ) {
    await handlePlatformComponentCreate(eventMessage)
  } else if (
    [
      CollaborationAMQPMessageType.ENTITY_COMMIT_CREATED,
      CollaborationAMQPMessageType.ENTITY_UPDATE,
    ].includes(eventMessage.type)
    && eventMessage.variables?.entity?.type === EntityType.PLATFORM_COMPONENT
  ) {
    await handlePlatformComponentUpdate(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_DELETE
    && eventMessage.variables?.entity?.type === EntityType.PLATFORM_COMPONENT
  ) {
    await handlePlatformComponentDelete(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_CREATE
    && eventMessage.variables?.entity?.type === EntityType.PLATFORM
  ) {
    await handlePlatformCreate(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_COMMIT_CREATED
    && eventMessage.variables?.entityCommit?.entityType === EntityType.PLATFORM
  ) {
    await handlePlatformUpdate(eventMessage)
  } else if (
    eventMessage.type === CollaborationAMQPMessageType.ENTITY_DELETE
    && eventMessage.variables?.entity?.type === EntityType.PLATFORM
  ) {
    await handlePlatformDelete(eventMessage)
  }
}
