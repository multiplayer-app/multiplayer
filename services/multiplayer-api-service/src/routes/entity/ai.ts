import type { NextFunction, Request, Response } from 'express'
import {
  AIExtractedComponent,
  CommitType,
  Component,
  ComponentType,
  Edge,
  EntityType,
  ErrorMessage, ErrorMessageWithParams,
  Platform,
  ProjectLinkObjectType,
} from '@multiplayer/types'
import { ObjectId } from '@multiplayer/mongo'
import { EntityConverter } from '@multiplayer/entity'
import {
  InternalServerError,
  InvalidArgumentError,
} from 'restify-errors'
import {
  IEntityCommitDocument,
  IEntityDocument,
  IPopulatedEntityStateDocument,
  ProjectLinkModel,
} from '@multiplayer/models'
import {
  AMQPLib,
  CommitLib,
  EntityCommitLib,
  EntityLib,
  ProjectBranchLib,
} from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string

    const {
      workspaceUser,
      projectBranch,
      lastCommit,
    } = req
    if (!workspaceUser || !projectBranch || !lastCommit) {
      return next(new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA))
    }
    const aiComponents: Record<string, AIExtractedComponent> = getUniqueComponentsMap(req.body.components)
    const platformName: string = req.body.name

    await failIfPlatformNameIsNotUnique(projectBranchId, platformName)

    const { data: foundComponentsState } = await ProjectBranchLib.getProjectBranchState(
      projectBranchId,
      {
        key: Object.keys(aiComponents),
        type: EntityType.PLATFORM_COMPONENT,
      },
      { limit: Object.keys(aiComponents).length },
    )
    const sortedAIComponents = await getSortedAIComponents(Object.values(aiComponents), foundComponentsState)
    const updatedEntitiesStates = await Promise.all(sortedAIComponents.update
      .filter(({ state, component }) =>
        state.entity.metadata?.type !== (ComponentType[component.type] || ComponentType.GENERIC),
      )
      .map(({ state, component }) =>
        EntityCommitLib.updateMeta({
          entity: state.entity.projectBranch.equals(projectBranch._id) ? state.entity : undefined,
          entityId: state.entity.entityId.toString(),
          currentProjectBranch: projectBranch,
          lastEntityCommit: state.entityCommit,
          metaPayload: {
            entityName: state.entity.key,
            summary: {
              ...(state.entity.metadata || {}),
              type: ComponentType[component.type] || ComponentType.GENERIC,
              ...component.metadata,
            },
          },
        }),
      ))

    const createComponentsResp = await EntityLib.bulkCreateEntities({
      workspaceId,
      projectId,
      projectBranchId,
      entities: sortedAIComponents.create.map((component) => ({
        key: component.name,
        type: EntityType.PLATFORM_COMPONENT,
        tags: component.tags,
        metadata: {
          type: ComponentType[component.type] || ComponentType.GENERIC,
          ...component.metadata,
        },
      })),
    })
    const states: Record<string, IPopulatedEntityStateDocument> ={
      ...convertStateToNamedMap(createComponentsResp),
      ...convertStateToNamedMap(sortedAIComponents.update.map(({ state }) => state)),
    }
    const entityNameToIdMap: Record<string, string> = Object.keys(states).reduce((acc, key) => {
      acc[key] = states[key].entity.entityId.toString()
      return acc
    }, {})

    const platformCreateResponse = await createPlatform({
      aiComponents: Object.values(aiComponents),
      platformName,
      entityNameToIdMap,
      workspaceId,
      projectId,
      projectBranchId,
    })

    const newLastCommit = await CommitLib.createCommit({
      projectBranch,
      lastCommit,
      entityCommits: [
        platformCreateResponse.entityCommit,
        ...createComponentsResp.map(({ entityCommit }) => entityCommit),
        ...updatedEntitiesStates.map(({ entityCommit }) => entityCommit),
      ],
      projectBranchState: foundComponentsState,
      message: 'create',
      label: 'create',
      type: CommitType.AUTO,
      workspaceUsers: [workspaceUser._id.toString()],
    })

    await Promise.all(createComponentsResp.map((componentData) =>
      ProjectLinkModel.createProjectLink(
        {
          sourceObject: platformCreateResponse.entity.entityId.toString(),
          sourceObjectType: ProjectLinkObjectType.Entity,
          sourceEntityType: EntityType.PLATFORM,
          targetObject: componentData.entity.entityId.toString(),
          targetObjectType: ProjectLinkObjectType.Entity,
          targetEntityType: EntityType.PLATFORM_COMPONENT,
          projectLinkId: new ObjectId().toString(),
          projectBranch: projectBranchId,
          createdAtCommit: newLastCommit._id.toString(),
          workspace: workspaceId,
          project: projectId,
          deletedAtCommit: null,
        })))


    await notifyAboutChanges(
      [platformCreateResponse, ...createComponentsResp],
      updatedEntitiesStates,
      !!projectBranch.default,
      projectBranch._id,
    )

    return res.status(200).json({
      platform: platformCreateResponse.entity,
      components: createComponentsResp.map(({ entity }) => entity),
    })
  } catch (err) {
    return next(err)
  }
}

async function failIfPlatformNameIsNotUnique(projectBranchId: string, name: string) {
  const foundDuplicate = await EntityCommitLib.getDuplicatesWithinBranch({
    keys: [name],
    projectBranchId,
    type: EntityType.PLATFORM,
  })
  if (foundDuplicate) {
    throw new InvalidArgumentError(ErrorMessageWithParams.NO_ALIAS_DUPLICATES(
      foundDuplicate.key,
      foundDuplicate.entity.key,
      foundDuplicate.entity.type,
    ))
  }
}

function getUniqueComponentsMap(aiComponents: AIExtractedComponent[]) {
  return aiComponents.reduce((acc, comp) => {
    acc[comp.name] = comp
    return acc
  }, {})
}

function convertStateToNamedMap(states: IPopulatedEntityStateDocument[]): Record<string, IPopulatedEntityStateDocument> {
  return states.reduce((acc, state) => {
    acc[state.entity.key] = state
    state.entity?.keyAliases?.forEach((alias) => {
      acc[alias] = state
    })
    return acc
  }, { })
}

async function getSortedAIComponents(aiComponents: AIExtractedComponent[], foundComponentsState: IPopulatedEntityStateDocument[]) {
  const foundComponentsNameMap = convertStateToNamedMap(foundComponentsState)

  const componentsToUpdate = aiComponents
    .filter((comp) => foundComponentsNameMap[comp.name])
    .map((component) => ({ state: foundComponentsNameMap[component.name], component }))

  const componentsToCreate = aiComponents
    .filter((comp) => !foundComponentsNameMap[comp.name])

  return {
    update: componentsToUpdate,
    create: componentsToCreate,
  }
}

async function notifyAboutChanges(
  createdEntities: {
    entity: IEntityDocument,
    entityCommit: IEntityCommitDocument,
  }[],
  updatedEntities: {
    entity: IEntityDocument,
    entityCommit: IEntityCommitDocument,
  }[],
  isDefaultBranch: boolean,
  branchId: ObjectId | string,
) {
  await Promise.all(createdEntities.map((compResponse) =>
    AMQPLib.notifyOnEntityCreate({
      entity: compResponse.entity.toJSON(),
      entityCommit: compResponse.entityCommit.toJSON(),
      isDefaultBranch,
    }),
  ))

  await Promise.all(updatedEntities.map((state) =>
    AMQPLib.notifyOnEntityUpdate({
      entity: state.entity.toJSON(),
      entityUpdatedAt: state.entity.updatedAt || '',
      isDefaultBranch,
      branchId: branchId?.toString(),
    }),
  ))
}

async function createPlatform(params: {
  aiComponents: AIExtractedComponent[]
  entityNameToIdMap: Record<string, string>
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  platformName: string,
}) {
  const platform: Platform = EntityConverter.getEmptyTemplateData(EntityType.PLATFORM, params.platformName)

  platform.components = Object.values(params.entityNameToIdMap).reduce((acc, id) => {
    acc[id] = { id, linkedTo: id }
    return acc
  }, {} as Record<string, Component>)

  platform.edges = params.aiComponents.reduce((acc, component) => {
    if (!component.dependencies) {
      return acc
    }
    return component.dependencies.map((depName) => ({
      id: `${params.entityNameToIdMap[component.name]}_${params.entityNameToIdMap[depName]}`,
      source: params.entityNameToIdMap[component.name],
      target: params.entityNameToIdMap[depName],
    })).reduce((edgesMap, edge) => {
      edgesMap[edge.id] = edge
      return edgesMap
    }, acc)
  }, {} as Record<string, Edge>)

  platform.views._all.visualizations = {
    diagram: params.aiComponents.reduce((acc, component) => {
      const id = params.entityNameToIdMap[component.name]
      acc[id] = {
        x: component.position?.x || 0,
        y: component.position?.y || 0,
      }
      return acc
    }, {}),
  }

  return EntityLib.createEntity({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    projectBranchId: params.projectBranchId,
    type: EntityType.PLATFORM,
    key: params.platformName,
    state: EntityConverter.convertDataToState(EntityType.PLATFORM, platform),
    keyAliases: [],
  })
}
