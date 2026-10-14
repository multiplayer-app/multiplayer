import type { Request, Response, NextFunction } from 'express'
import {
  ProjectBranchModel,
  CommitModel,
  EntityCommitModel,
  EntityUpdateModel,
  EntityModel,
  EnvironmentModel,
  GitRefTagModel,
  PlatformRelationModel,
  ProjectLinkModel,
  VariableSchemaModel,
  VariablesValueModel,
} from '@multiplayer/models'
import { AMQPLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const workspaceId = req.params.workspaceId as string

    await Promise.all([
      ProjectBranchModel.deleteProjectBranchById(projectBranchId),
      CommitModel.deleteCommitsByProjectBranch(projectBranchId),
      EntityCommitModel.deleteEntityCommitsByProjectBranch(projectBranchId),
      EntityUpdateModel.deleteEntityUpdatesByProjectBranch(projectBranchId),
      EntityModel.deleteEntitiesByProjectBranch(projectBranchId),
      EnvironmentModel.deleteEnvironmentsByProjectBranch(projectBranchId),
      GitRefTagModel.deleteGitRefTagsByProjectBranch(projectBranchId),
      PlatformRelationModel.deletePlatformRelationsByProjectBranch(projectBranchId),
      ProjectLinkModel.deleteProjectLinkByProjectBranch(projectBranchId),
      VariableSchemaModel.deleteVariableSchemasByWorkspace(projectBranchId),
      VariablesValueModel.deleteVariableValuesByProjectBranch(projectBranchId),
    ])

    await AMQPLib.notifyOnBranchDelete({
      projectId,
      branchId: projectBranchId,
      workspaceId,
    })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
