import { AccessControlContext } from '@multiplayer/auth'
import { NotFoundError } from 'restify-errors'
import {
  ProjectModel,
  IProjectDocument,
  IUserDocument,
  WorkspaceModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import logger from '@multiplayer/logger'
import type { ObjectId } from '@multiplayer/mongo'
import * as ForkUtil from './fork.util'

const forkTemplateProjectForWorkspace = async (
  user: IUserDocument,
  workspaceIdTo: string | ObjectId,
  sampleProject: IProjectDocument,
): Promise<void> => {
  const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
    user._id,
    workspaceIdTo,
  )
  if (!workspaceUser) {
    throw new NotFoundError('Workspace-user not found')
  }

  await ForkUtil.cloneProject(
    sampleProject.workspace,
    sampleProject._id,
    workspaceIdTo,
    workspaceUser,
    true,
  )
  await WorkspaceModel.updateWorkspaceById(
    workspaceIdTo,
    {
      finishedCopyingSampleData: true,
    },
  )
  await AccessControlContext.invalidateContext({
    workspaceId: workspaceIdTo.toString(),
  })
}

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

    // Fired off, not awaited: cloning happens in the background (same as when this
    // went through the `fork` AMQP queue) so this function returns as soon as the
    // jobs are kicked off, not once every template project has finished cloning.
    templateProjects.forEach((sampleProject) => {
      forkTemplateProjectForWorkspace(user, workspaceIdTo, sampleProject)
        .catch(err => logger.error(err, `Failed to fork template project for user ${user._id}`))
    })
  } catch (error) {
    logger.error(error, `Failed to clone template project for user ${user._id}`)
  }
}
