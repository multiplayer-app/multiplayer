import {
  BranchDeletedMessage,
  CollaborationAMQPMessageType,
  CommentCreatedMessage,
  EntityCommitMessage,
  EntityCreatedMessage,
  EntityDeletedMessage,
  EntityUpdatedMessage,
  IEntity,
  ThreadCreatedMessage,
  ProjectLinkDeletedMessage,
  ICommit,
  IEntityCommit,
} from '@multiplayer/types'
import AMQP from '@multiplayer/amqp'
import logger from '@multiplayer/logger'
import {
  IEntityCommitDocument,
} from '@multiplayer/models'
import { AMQP_EVENT_QUEUE } from '../config'

export async function notifyOnThreadCreate(params: ThreadCreatedMessage) {
  try {
    return AMQP.publish(
      AMQP_EVENT_QUEUE,
      {
        type: CollaborationAMQPMessageType.THREAD_CREATE,
        variables: params,
      },
      { durable: true, fanout: true },
    )
  } catch (err) {
    logger.error(err, 'Cannot send AMQP.THREAD_CREATE message')
  }
}

export async function notifyOnCommentCreate(params: CommentCreatedMessage) {
  try {
    return AMQP.publish(
      AMQP_EVENT_QUEUE,
      {
        type: CollaborationAMQPMessageType.COMMENT_CREATE,
        variables: params,
      },
      { durable: true, fanout: true },
    )
  } catch (err) {
    logger.error(err, 'Cannot send AMQP.COMMENT_CREATE message')
  }
}

export async function notifyOnEntityCreate(params: EntityCreatedMessage) {
  try {
    return AMQP.publish(
      AMQP_EVENT_QUEUE,
      {
        type: CollaborationAMQPMessageType.ENTITY_CREATE,
        variables: params,
      },
      { durable: true, fanout: true },
    )
  } catch (err) {
    logger.error(err, 'Cannot send AMQP.ENTITY_CREATE message')
  }
}

export async function notifyOnEntityUpdate(params: EntityUpdatedMessage) {
  try {
    return AMQP.publish(
      AMQP_EVENT_QUEUE,
      {
        type: CollaborationAMQPMessageType.ENTITY_UPDATE,
        variables: params,
      },
      { durable: true, fanout: true },
    )
  } catch (err) {
    logger.error(err, 'Could not send AMQP.ENTITY_UPDATE message')
  }
}

export async function notifyOnEntityDelete(params: EntityDeletedMessage) {
  try {
    return AMQP.publish(
      AMQP_EVENT_QUEUE,
      {
        type: CollaborationAMQPMessageType.ENTITY_DELETE,
        variables: params,
      },
      { durable: true, fanout: true },
    )
  } catch (err) {
    logger.error(err, 'Could not send AMQP.ENTITY_DELETE message')
  }
}

export async function notifyOnBranchDelete(params: BranchDeletedMessage) {
  try {
    return AMQP.publish(
      AMQP_EVENT_QUEUE,
      {
        type: CollaborationAMQPMessageType.BRANCH_DELETE,
        variables: params,
      },
      { durable: true, fanout: true },
    )
  } catch (err) {
    logger.error(err, 'Cannot send AMQP.BRANCH_DELETE message')
  }
}

export async function notifyOnCommit(params: {
  entityCommits: IEntityCommitDocument[],
  commit: ICommit,
  isDefaultBranch: boolean,
}) {
  try {
    await Promise.all(params.entityCommits.map((entityCommit) => {
      const entity = entityCommit.entity as any as IEntity

      const variables: EntityCommitMessage = {
        workspaceId: entityCommit.workspace.toString(),
        projectId: entityCommit.project.toString(),
        branchId: entityCommit.projectBranch.toString(),
        entityId: entity.entityId.toString(),
        isDefaultBranch: params.isDefaultBranch,
        entity,
        commit: params.commit,
        entityCommit: {
          ...entityCommit?.toJSON ? entityCommit.toJSON() : entityCommit as unknown as IEntityCommit,
          commit: params.commit,
        },
      }
      return AMQP.publish(
        AMQP_EVENT_QUEUE,
        {
          type: CollaborationAMQPMessageType.ENTITY_COMMIT_CREATED,
          variables,
        },
        { durable: true, fanout: true },
      )
    }))
  } catch (err) {
    logger.error(err, 'Could not AMQP.ENTITY_COMMIT message')
  }
}


export async function notifyOnProjectLinkDelete(params: ProjectLinkDeletedMessage) {
  try {
    return AMQP.publish(
      AMQP_EVENT_QUEUE,
      {
        type: CollaborationAMQPMessageType.PROJECT_LINK_DELETE,
        variables: params,
      },
      { durable: true, fanout: true },
    )
  } catch (err) {
    logger.error(err, 'Could not send AMQP.ENTITY_DELETE message')
  }
}
