import {
  NotFoundError,
  InternalError,
} from 'restify-errors'
import {
  EntityModel,
  ProjectLinkModel,
} from '@multiplayer/models'
import AMQP from '@multiplayer/amqp'
import logger from '@multiplayer/logger'
import { ObjectId } from '@multiplayer/mongo'
import { s3 } from '@multiplayer/s3'
import {
  ErrorMessage,
  EntityCommitStorageType,
  EntityType,
  ProjectLinkObjectType,
  IEntity,
  IGitRef,
  CollaborationRPCMessageType,
  GetEntityStateRequest,
} from '@multiplayer/types'
import * as yaml from 'yaml'
import { EntityConverter, Y } from '@multiplayer/entity'
import { AMQP_COLLABORATION_RPC_QUEUE } from '../config'
import {
  InternalVersionService,
  VersionService,
  InternalGitService,
} from '../services'
import { shareEntityUpdate } from '../amqp'

const parseOpenApi = (openApiDoc: string): { content: object, format: 'JSON' | 'YAML' } => {
  try {
    return {
      content: JSON.parse(openApiDoc),
      format: 'JSON',
    }
  } catch {
    try {
      return {
        content: yaml.parse(openApiDoc),
        format: 'YAML',
      }
    } catch (error) {
      throw new Error('Not valid openapi document')
    }
  }
}

export const getExistingOpenApiDoc = async (
  workspaceId: string,
  projectId: string,
  projectBranchTreeIds: string[] | ObjectId[],
  platformComponentEntityId: string | ObjectId,
  workspaceUserId?: string,
): Promise<{
  document: Y.Doc,
  entityId: string,
} | false> => {
  try {
    const currentBranchId = projectBranchTreeIds[projectBranchTreeIds.length -1]
    const { data: [apiLink] } = await ProjectLinkModel.getProjectLinkState(
      projectBranchTreeIds,
      {
        sourceObjectType: ProjectLinkObjectType.Entity,
        targetObjectType: ProjectLinkObjectType.Entity,
        sourceEntityType: EntityType.API,
        targetObjectId: platformComponentEntityId,
      },
    )

    if (!apiLink) {
      return false
    }

    const apiFileEntityId = (apiLink.sourceObject as any as IEntity).entityId

    const projectBranchState = await EntityModel.getProjectBranchState(
      projectBranchTreeIds, { entityId: apiFileEntityId },
    )
    if (!projectBranchState.data.length || !projectBranchState.data[0].entityCommit) {
      throw new NotFoundError(ErrorMessage.ENTITY_COMMIT_NOT_FOUND)
    }
    const entityCommit = projectBranchState.data[0].entityCommit

    let openApiDoc

    if (entityCommit.storageType === EntityCommitStorageType.S3) {
      const openApiState = await AMQP.request(
        AMQP_COLLABORATION_RPC_QUEUE,
        {
          type: CollaborationRPCMessageType.GET_ENTITY_STATE,
          variables: {
            workspaceId,
            projectId,
            branchId: currentBranchId,
            entityId: apiFileEntityId,
          } as GetEntityStateRequest,
        },
      ) as any

      openApiDoc = new Y.Doc()
      Y.applyUpdate(openApiDoc, new Uint8Array(openApiState.state))
    } else if (entityCommit.storageType === EntityCommitStorageType.GIT) {
      if (!(apiLink.sourceObject as any as IEntity).gitRef) {
        throw new InternalError('Not enough records to find entity document')
      }

      const gitService = new InternalGitService()
      const rawOpenApiDoc = await gitService.getContents(
        (apiLink.sourceObject as any as IEntity).gitRef as IGitRef,
        projectId,
        workspaceId,
      )

      const parsedOpenApiDoc = parseOpenApi(rawOpenApiDoc)
      const openApiState = EntityConverter.getInitialContent(
        EntityType.API,
        {
          contents: JSON.stringify(parsedOpenApiDoc.content),
        },
      )

      openApiDoc = new Y.Doc()
      Y.applyUpdate(openApiDoc, openApiState)

      await shareEntityUpdate({
        workspaceId,
        projectId,
        entityId: apiFileEntityId,
        update: Y.encodeStateAsUpdate(openApiDoc),
        branchId: projectBranchTreeIds[projectBranchTreeIds.length - 1] as string,
        workspaceUserId,
        entityType: EntityType.API,
      })
    }

    return {
      document: openApiDoc,
      entityId: apiFileEntityId,
    }
  } catch (error) {
    logger.error(
      error,
      {
        workspaceId,
        projectId,
        platformComponentEntityId,
        projectBranchTreeIds,
      },
    )

    return false
  }
}

export const addOpenApiDoc = async (
  cookie: string | undefined,
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  platformComponentEntityId: string,
  workspaceUserId?: string,
): Promise<{
  document: Y.Doc,
  entityId: string,
}> => {
  let versionService
  if (cookie) {
    versionService = new VersionService(cookie)
  } else {
    versionService = new InternalVersionService()
  }

  const {
    entity: apiFileEntity,
    entityCommit,
  } = await versionService.createEntity({
    workspaceId,
    projectId,
    branchId: projectBranchId,
    payload: {
      key: 'swagger.json',
      type: EntityType.API,
      path: '/',
      archived: false,
    },
  })

  await versionService.createLink(
    {
      workspaceId,
      projectId,
      projectBranchId,
      sourceEntityId: apiFileEntity.entityId,
      targetEntityId: platformComponentEntityId,
    },
  )

  const openApiState = await s3.downloadFileAsByteArray(
    entityCommit.key as string,
    entityCommit.bucket as string,
  )

  const openApiDoc = new Y.Doc()
  Y.applyUpdate(openApiDoc, openApiState as Uint8Array)

  return {
    document: openApiDoc,
    entityId: apiFileEntity.entityId,
  }
}
