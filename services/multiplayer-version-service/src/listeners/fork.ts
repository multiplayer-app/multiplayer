import { AccessControlContext } from '@multiplayer/auth'
import {
  WorkspaceUserModel,
  WorkspaceModel,
} from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { NotFoundError } from 'restify-errors'
import { ForkUtil } from '../utils'

export default async (message: any) => {
  const {
    workspaceIdFrom,
    projectIdFrom,
    workspaceIdTo,
    user,
    type,
    onlyLatestState,
  } = message?.variables || {}

  let workspaceId

  try {
    if (type === 'PROJECT') {
      const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
        user,
        workspaceIdTo,
      )
      if (!workspaceUser) {
        throw new NotFoundError('Workspace-user not found')
      }

      await ForkUtil.cloneProject(
        workspaceIdFrom,
        projectIdFrom,
        workspaceIdTo,
        workspaceUser,
        onlyLatestState,
      )
      await WorkspaceModel.updateWorkspaceById(
        workspaceIdTo,
        {
          finishedCopyingSampleData: true,
        },
      )

      workspaceId = workspaceIdTo
    } else if (type === 'WORKSPACE') {
      const newWorkspace = await ForkUtil.cloneWorkspace(user, workspaceIdFrom)
      await WorkspaceModel.updateWorkspaceById(
        newWorkspace._id,
        {
          finishedCopyingSampleData: true,
        },
      )

      workspaceId = newWorkspace._id
    }

    if (workspaceId) {
      await AccessControlContext.invalidateContext({
        workspaceId,
      })
    }
  } catch (error) {
    logger.error(error, '[CLONE] Error during cloning')
    throw error
  }
}
