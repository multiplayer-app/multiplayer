import type { Request, Response, NextFunction } from 'express'
import { GitRepositoryLib } from '../../libs'
import { GitRepositoryModel, IntegrationModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const gitRepositoryId = req.params.gitRepositoryId as string
    const gitRepositoryToDelete = await GitRepositoryModel.findGitRepositoryById(gitRepositoryId)

    if (!gitRepositoryToDelete ||
      gitRepositoryToDelete.workspace.toString() !== workspaceId ||
      gitRepositoryToDelete.project.toString() !== projectId) {
      throw new NotFoundError(ErrorMessage.GIT_REPOSITORY_NOT_FOUND)
    }
    const integration = await IntegrationModel.findIntegrationInWorkspace(
      workspaceId,
      gitRepositoryToDelete.gitRepository.type,
    )

    if (!integration && gitRepositoryToDelete.gitRepository.private) {
      throw new NotFoundError(ErrorMessage.INTEGRATION_NOT_FOUND)
    }
    await GitRepositoryLib.deleteGitRepositoryWithRelations(gitRepositoryToDelete, integration)
    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
