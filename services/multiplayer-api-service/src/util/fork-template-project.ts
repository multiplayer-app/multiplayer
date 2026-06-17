import {
  ProjectModel,
  IUserDocument,
  WorkspaceModel,
} from '@multiplayer/models'
import AMQP from '@multiplayer/amqp'
import logger from '@multiplayer/logger'
import type { ObjectId } from '@multiplayer/mongo'
import { AMQP_FORK_QUEUE } from '../config'

export default async (
  user: IUserDocument,
  workspaceIdTo: string | ObjectId,
): Promise<void> => {
  try {
    const templateProjects = await ProjectModel.findTemplateProjects()

    logger.info({
      user: user._id,
      projects: templateProjects.length,
    }, 'Starting to fork template projects')

    if (templateProjects.length === 0) {
      await WorkspaceModel.updateWorkspaceById(
        workspaceIdTo,
        {
          finishedCopyingSampleData: true,
        },
      )

      return
    }

    await Promise.all(templateProjects.map(sampleProject =>
      AMQP.publish(
        AMQP_FORK_QUEUE,
        {
          variables: {
            type: 'PROJECT',
            user: user._id,
            workspaceIdTo,
            workspaceIdFrom: sampleProject.workspace,
            projectIdFrom: sampleProject._id,
            onlyLatestState: true,
          },
        },
        {
          durable: true,
        },
      ),
    ))
  } catch (error) {
    logger.error(error, `Failed to clone template project for user ${user._id}`)
  }
}
