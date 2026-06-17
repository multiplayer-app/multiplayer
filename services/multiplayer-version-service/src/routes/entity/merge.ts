import type { NextFunction, Request, Response } from 'express'
import AMQP from '@multiplayer/amqp'
import {
  InternalServerError,
  NotFoundError,
  InvalidArgumentError,
} from 'restify-errors'
import {
  CommitType,
  EntityType,
  CollaborationRPCMessageType,
} from '@multiplayer/types'
import { slugifyString } from '@multiplayer/util-shared'
import {
  EntityConverter,
  PlatformHelper,
  Y,
} from '@multiplayer/entity'
import {
  EntityModel,
  ProjectBranchModel,
  IEntityCommitDocument,
  IEntityDocument,
  IPopulatedEntityStateDocument,
} from '@multiplayer/models'
import {
  AMQPLib,
  CommitLib,
  EntityLib,
  ProjectBranchLib,
} from '../../lib'
import { PlatformUtil } from '../../utils'
import { AMQP_COLLABORATION_RPC_QUEUE } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string

    const type = req.body.type as EntityType
    const _key = req.body.key as string
    const _keyAliases = req.body.keyAliases as string[] || []

    const key = slugifyString(_key)
    const keyAliases = _keyAliases.map(slugifyString)

    let entityIds = req.body.entityIds as string[] || []
    const {
      workspaceUser,
      projectBranch,
      lastCommit,
    } = req

    if (!projectBranch || !lastCommit) {
      throw new InternalServerError('Required data is missed')
    }

    const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)

    let baseEntity = await EntityModel.getEntityInBranchByKey(
      key,
      projectBranches.map(({ _id }) => _id),
      {
        workspace: workspaceId,
        project: projectId,
        type,
      },
    )

    let updatedBaseEntityCommit: IEntityCommitDocument | undefined

    let shouldCreateNewEntity = false

    if (!baseEntity) {
      shouldCreateNewEntity = true
    } else {
      entityIds = entityIds.filter(entityId => !baseEntity.entityId.equals(entityId))
    }

    let entitiesToMerge: IEntityDocument[] = []
    let projectBranchState: IPopulatedEntityStateDocument[] = []
    let deletedEntities: {
      entityCommit: IEntityCommitDocument,
      entity: IEntityDocument
    }[] = []

    if (entityIds?.length) {
      entitiesToMerge = await EntityModel.getEntitiesInBranchByEntityIds(
        entityIds,
        projectBranches.map(({ _id }) => _id),
        {
          workspace: workspaceId,
          project: projectId,
          type,
        },
      )

      if (entitiesToMerge.length !== entityIds.length) {
        throw new NotFoundError('Entities not found')
      }

      if (
        entitiesToMerge.some(entity => entity.type !== type)
      ) {
        throw new InvalidArgumentError('Entities should have same type')
      }

      const { data: _projectBranchState } = await ProjectBranchLib.getProjectBranchState(
        projectBranchId,
        {
          entityId: entityIds,
          type,
        },
      )

      projectBranchState = _projectBranchState

      deletedEntities = await EntityLib.bulkDeleteEntities({
        workspaceId,
        projectId,
        projectBranch,
        entityIds,
        type,
      })
    }

    if (shouldCreateNewEntity) {
      const state = EntityConverter.getInitialContent(
        type,
        {},
        key,
      )

      const createdEntity = await EntityLib.createEntity({
        workspaceId,
        projectId,
        projectBranchId,
        type,
        key,
        state,
        keyAliases: [...new Set([
          ...keyAliases,
          ...entitiesToMerge.flatMap(entity => [
            entity.key,
            ...entity.keyAliases,
          ]),
        ])].filter(keyAlias => keyAlias != key),
        tags: [],
      })

      baseEntity = createdEntity.entity
      updatedBaseEntityCommit = createdEntity.entityCommit
    } else {
      const updatedEntity = await EntityLib.updateEntity(
        baseEntity.entityId,
        projectBranch,
        {
          keyAliases: [...new Set([
            ...baseEntity.keyAliases,
            ...keyAliases,
            ...entitiesToMerge.flatMap(entityToMerge => [
              entityToMerge.key,
              ...entityToMerge.keyAliases,
            ]),
          ])].filter(keyAlias => keyAlias != key),
        },
      )

      baseEntity = updatedEntity.entity
      updatedBaseEntityCommit = updatedEntity.entityCommit
    }

    // update platforms if merged components
    if (type === EntityType.PLATFORM_COMPONENT) {
      const { data: platformEntities } = await EntityModel.findEntities({
        workspace: workspaceId,
        project: projectId,
        projectBranch: projectBranches.map(({ _id }) => _id),
        type: EntityType.PLATFORM,
      })

      for (const platformEntity of platformEntities) {
        const platformDoc = await PlatformUtil.getPlatform(
          workspaceId,
          projectId,
          projectBranch._id.toString(),
          platformEntity.entityId.toString(),
        )

        const isBaseComponentAddedToPlatform = PlatformHelper.isComponentAddedToPlatform(
          platformDoc,
          baseEntity.entityId.toString(),
        )

        const updates: any[] = []

        if (!isBaseComponentAddedToPlatform) {
          const vector = Y.encodeStateVector(platformDoc)
          const update = Y.encodeStateAsUpdate(
            PlatformHelper.addComponentToPlatform(
              platformDoc,
              baseEntity.entityId.toString(),
              baseEntity.entityId.toString(),
            ),
            vector,
          )

          updates.push(update)
        }

        for (const entityId of entityIds) {
          const isAddedToPlatform = PlatformHelper.isComponentAddedToPlatform(
            platformDoc,
            entityId,
          )

          if (!isAddedToPlatform) {
            continue
          }

          const fromEdges = PlatformHelper.getEdgesInPlatformFromComponent(
            platformDoc,
            entityId,
          )

          for (const edge of fromEdges) {
            const isEdgeExists = PlatformHelper.isEdgeExistsInPlatform(
              platformDoc,
              baseEntity.entityId.toString(),
              edge.targetComponentId,
            )

            if (!isEdgeExists) {
              const vector = Y.encodeStateVector(platformDoc)
              const update = Y.encodeStateAsUpdate(PlatformHelper.addEdgeToPlatform(
                platformDoc,
                baseEntity.entityId.toString(),
                edge.targetComponentId,
              ), vector)

              updates.push(update)
            }

            const vector = Y.encodeStateVector(platformDoc)
            const update = Y.encodeStateAsUpdate(
              PlatformHelper.removeEdgeFromPlatform(
                platformDoc,
                edge.sourceComponentId,
                edge.targetComponentId,
              ),
              vector,
            )
            updates.push(update)
          }

          const toEdges = PlatformHelper.getEdgesInPlatformFromComponent(
            platformDoc,
            entityId,
          )

          for (const edge of toEdges) {
            const isEdgeExists = PlatformHelper.isEdgeExistsInPlatform(
              platformDoc,
              edge.sourceComponentId,
              baseEntity.entityId.toString(),
            )

            if (!isEdgeExists) {
              const vector = Y.encodeStateVector(platformDoc)
              const update = Y.encodeStateAsUpdate(PlatformHelper.addEdgeToPlatform(
                platformDoc,
                edge.sourceComponentId,
                baseEntity.entityId.toString(),
              ), vector)

              updates.push(update)
            }

            const vector = Y.encodeStateVector(platformDoc)
            const update = Y.encodeStateAsUpdate(
              PlatformHelper.removeEdgeFromPlatform(
                platformDoc,
                edge.sourceComponentId,
                edge.targetComponentId,
              ),
              vector,
            )
            updates.push(update)
          }
        }

        if (updates.length) {
          await AMQP.request(
            AMQP_COLLABORATION_RPC_QUEUE,
            {
              type: CollaborationRPCMessageType.UPDATE_ENTITY_STATE,
              variables: {
                workspaceId,
                projectId,
                branchId: projectBranchId,
                entityId: platformEntity.entityId.toString(),
                state: Object.values(Y.mergeUpdates(updates)),
                workspaceUserId: workspaceUser?._id?.toString(),
                entityType: platformEntity.type,
              },
            },
          )
        }
      }
    }

    await CommitLib.createCommit({
      projectBranch,
      lastCommit,
      entityCommits: [
        ...updatedBaseEntityCommit
          ? [updatedBaseEntityCommit]
          : [],
        ...deletedEntities.map(({ entityCommit }) => entityCommit),
      ],
      projectBranchState,
      message: 'merge entities',
      label: 'merge',
      type: CommitType.AUTO,
      workspaceUsers: [workspaceUser?._id?.toString() as string],
    })

    await Promise.all([
      ...deletedEntities.map(deletedEntity =>
        AMQPLib.notifyOnEntityDelete({
          workspaceId,
          projectId,
          entityId: deletedEntity.entity.entityId.toString(),
          branchId: projectBranchId,
          isDefaultBranch: !!projectBranch.default,
          entity: deletedEntity.entity.toObject(),
        }),
      ),

      shouldCreateNewEntity && updatedBaseEntityCommit
        ? AMQPLib.notifyOnEntityCreate({
          entity: baseEntity.toJSON(),
          entityCommit: updatedBaseEntityCommit.toJSON(),
          isDefaultBranch: !!projectBranch.default,
        })
        : AMQPLib.notifyOnEntityUpdate({
          entity: baseEntity.toObject(),
          entityUpdatedAt: baseEntity.updatedAt || '',
          isDefaultBranch: !!projectBranch.default,
          branchId: projectBranch._id.toString(),
        }),
    ])

    return res.status(200).json({
      entityCommit: updatedBaseEntityCommit,
      entity: baseEntity,
    })
  } catch (err) {
    return next(err)
  }
}
