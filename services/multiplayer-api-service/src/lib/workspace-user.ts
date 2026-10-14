import { GitRepositoryModel, IntegrationModel, IWorkspaceUserDocument, ProjectModel, WorkspaceUserModel } from '@multiplayer/models'
import { JoiValidator } from '@multiplayer/util'
import { InternalServerError, InvalidArgumentError } from 'restify-errors'
import { Request } from 'express'

const fetchWorkspaceUserByIntegrationId = async (userId, integrationId): Promise<IWorkspaceUserDocument | undefined> => {
  if (!JoiValidator.isValidId(integrationId)) {
    throw new InvalidArgumentError('Invalid id format')
  }
  if (!userId) {
    throw new InternalServerError('User id is missed')
  }

  return IntegrationModel.getWorkspaceUserByIntegrationAndUserId(integrationId, userId)
}

export const fetchWorkspaceUserByIntegrationIdInParams = (req: Request) => {
  return fetchWorkspaceUserByIntegrationId(req.session.current, req.params.integrationId)
}

export const fetchWorkspaceUserByRepositoryIdInParams = (req: Request) => {
  if (!JoiValidator.isValidId(req.params.gitRepositoryId as string)) {
    throw new InvalidArgumentError('Invalid id format')
  }
  if (!req.session.current) {
    throw new InternalServerError('User id is missed')
  }

  return GitRepositoryModel.getWorkspaceUserByGitRepositoryAndUserId(
    req.params.gitRepositoryId as string,
    req.session.current,
  )
}

const fetchWorkspaceUserByFilter = async (userId, filter: { project?: string, integration?: string, workspace?: string }) => {
  const { project, integration, workspace } = filter
  if (!userId) {
    throw new InternalServerError('User id is missed')
  }

  if (integration && JoiValidator.isValidId(integration)) {
    return fetchWorkspaceUserByIntegrationId(integration, userId)
  }
  if (project && JoiValidator.isValidId(project)) {
    const projectDoc = await ProjectModel.findProjectById(project)
    return projectDoc ? WorkspaceUserModel.findWorkspaceUser(userId, projectDoc.workspace) : undefined
  }
  if (workspace && JoiValidator.isValidId(workspace)) {
    return WorkspaceUserModel.findWorkspaceUser(userId, workspace)
  }
  return undefined
}

export const fetchWorkspaceUserByQueryFilter = async (req) => {
  return fetchWorkspaceUserByFilter(req.session.current, req.query)
}

export const fetchWorkspaceUserByBodyFilter = async (req) => {
  return fetchWorkspaceUserByFilter(req.session.current, req.body)
}


const fetchWorkspaceUserByWorkspaceId = async (userId, workspaceId) => {
  if (!userId) {
    throw new InternalServerError('User id is missed')
  }
  if (workspaceId && !JoiValidator.isValidId(workspaceId)) {
    throw new InvalidArgumentError('Invalid id format')
  }
  return WorkspaceUserModel.findWorkspaceUser(userId, workspaceId)
}

export const fetchWorkspaceUserByWorkspaceIdInQuery = async (req) => {
  return fetchWorkspaceUserByWorkspaceId(req.session.current, req.query.workspace)
}

export const fetchWorkspaceUserByWorkspaceIdInBody = async (req) => {
  return fetchWorkspaceUserByWorkspaceId(req.session.current, req.body.workspace)
}
