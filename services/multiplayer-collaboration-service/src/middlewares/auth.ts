import express from 'express'
import { Socket } from 'socket.io'
import logger from '@multiplayer/logger'
import {
  DebugSessionModel,
  EntityModel,
  ProjectBranchModel,
  ProjectModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import { ExtendedError, DefaultEventsMap } from 'socket.io'
import { ProjectSocketData } from '../interfaces/project-socket-data'
import { InternalServerError } from 'restify-errors'
import {
  YjsEntitySocketData,
  YjsRequestSocketData, YjsSessionNotesSocketData,
  YjsSocketData,
} from '../interfaces/yjs-socket-data'
import {
  RoleAccessAction,
  EntityCommitChangeType,
  ErrorMessage,
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity, SocketIOError,
} from '@multiplayer/types'
import { AccessControl } from '@multiplayer/auth'

export const socketCheckPermissions = (permissions: {
  entity?: RoleWorkspacePermissionEntity | RoleProjectPermissionEntity | undefined;
  action?: RoleAccessAction | undefined
}) =>
  (socket: Socket<any, any, any, YjsEntitySocketData | YjsRequestSocketData| ProjectSocketData | YjsSessionNotesSocketData>, next) => {
    const req = socket.request as express.Request
    req.params = {
      workspaceId: socket.data.workspaceId,
      projectId: socket.data.projectId,
    }
    if ('branchId' in socket.data) {
      req.params.branchId = (socket.data as YjsEntitySocketData).branchId
    }
    if ('entityId' in socket.data) {
      req.params.entityId = (socket.data as YjsEntitySocketData).entityId
    }
    if ('sessionId' in socket.data) {
      req.params.debugSessionId = (socket.data as YjsSessionNotesSocketData).sessionId
    }

    return AccessControl.checkPermissions(permissions)(
      req,
      {} as express.Response,
      (err: any) => {
        if (err) {
          return next(new SocketIOError(err, 403))
        }

        return next()
      },
    )
  }

export async function fetchProject(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, YjsSocketData | ProjectSocketData>, next) {
  try {
    const ids = socket.nsp.name.replace(/\/.*\|/, '').split('/')
    if (ids.length < 1) {
      return next(new SocketIOError(ErrorMessage.INVALID_REQUEST, 409))
    }
    const projectId = ids[0]
    const project = await ProjectModel.findProjectById(projectId)

    if (!project) {
      return next(new SocketIOError(ErrorMessage.PROJECT_NOT_FOUND, 404))
    }

    socket.data.projectId = project._id.toString()
    socket.data.workspaceId = project.workspace.toString()
    return next()
  } catch (err) {
    logger.error(err)
    return next(new SocketIOError(ErrorMessage.INTERNAL_ERROR, 500))
  }
}

export async function fetchDefaultBranch(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, ProjectSocketData>, next) {
  try {
    const projectId = socket.data.projectId
    const defaultBranch = await ProjectBranchModel.getDefaultProjectBranch(projectId)
    if (!defaultBranch) {
      logger.error(`DefaultBranch is missed for ${projectId}`)
      return next(new SocketIOError(ErrorMessage.DEFAULT_BRANCH_MISSED, 403))
    }
    socket.data.defaultBranchId = defaultBranch._id.toString()
    return next()
  } catch (err) {
    logger.error(err)
    return next(new InternalServerError())
  }
}

export async function fetchBranch(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, YjsEntitySocketData | YjsRequestSocketData>, next) {
  try {
    if (!socket.data.projectId) {
      return next(new Error(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA))
    }

    const ids = socket.nsp.name.replace(/\/.*\|/, '').split('/')
    if (ids.length < 2) {
      return next(new SocketIOError(ErrorMessage.INVALID_REQUEST, 409))
    }
    const branchId = ids[1]
    const branch = await ProjectBranchModel.findProjectBranchById(branchId)

    if (!branch || branch.project.toString() !== socket.data.projectId) {
      return next(new SocketIOError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND, 404))
    }
    socket.data.branchId = branchId
    socket.data.isDefaultBranch = !!branch.default
    return next()
  } catch (err) {
    logger.error(err)
    return next(new SocketIOError(ErrorMessage.INTERNAL_ERROR, 500))
  }
}

export async function fetchEntity (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, YjsEntitySocketData>,
  next,
) {
  try {
    if (!socket.data.projectId) {
      return next(new Error(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA))
    }

    const ids = socket.nsp.name.replace(/\/.*\|/, '').split('/')
    if (ids.length < 3) {
      return next(new SocketIOError(ErrorMessage.INVALID_REQUEST, 409))
    }

    const entityId = ids[2]
    const projectBranches = await ProjectBranchModel.getProjectBranchTree(socket.data.branchId)
    const entity = await EntityModel.getEntityInBranchByEntityId(
      entityId,
      projectBranches.map(({ _id }) => _id),
      {
        project: socket.data.projectId,
        deleted: true,
      },
    )
    if (!entity) {
      return next(new SocketIOError(ErrorMessage.ENTITY_NOT_FOUND, 404))
    }
    if (entity.typeOfChangeInBranch === EntityCommitChangeType.DELETE) {
      return next(new SocketIOError(ErrorMessage.ENTITY_WAS_REMOVED, 405))
    }
    socket.data.entityId = entityId
    return next()
  } catch (err) {
    logger.error(err)
    return next(new SocketIOError(ErrorMessage.INTERNAL_ERROR, 500))
  }
}

export async function fetchSession(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, YjsSessionNotesSocketData>, next: (err?: ExtendedError) => void) {
  try {
    const ids = socket.nsp.name.replace(/\/.*\|/, '').split('/')
    if (ids.length !== 1) {
      return next(new SocketIOError(ErrorMessage.INVALID_REQUEST, 409))
    }
    const sessionId = ids[0]
    const step = await DebugSessionModel.findDebugSessionById(sessionId)
    if (!step) {
      return next(new SocketIOError('Step not found', 404))
    }
    socket.data.workspaceId = step.workspace.toString()
    socket.data.projectId = step.project.toString()
    socket.data.sessionId = step._id.toString()
    return next()
  } catch (err) {
    logger.error(err)
    return next(new SocketIOError(ErrorMessage.INTERNAL_ERROR, 500))
  }
}
export async function fetchWorkspaceUser(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, YjsSocketData | ProjectSocketData>, next: (err?: ExtendedError) => void) {
  try {
    if (!socket.data.projectId || !socket.data.workspaceId) {
      return next(new Error(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA))
    }
    if ((socket.request as any).context?.guest) {
      return next()
    }

    const user = await WorkspaceUserModel.findWorkspaceUser(
      socket.request.session.current.toString(),
      socket.data.workspaceId,
    )
    if (!user) {
      return next(new SocketIOError(ErrorMessage.AUTH_FAILED, 401))
    }

    socket.data.user = user.toJSON()
    socket.data.userId = user._id.toString()
    return next()
  } catch (err) {
    logger.error(err)
    return next(new SocketIOError(ErrorMessage.INTERNAL_ERROR, 500))
  }
}
