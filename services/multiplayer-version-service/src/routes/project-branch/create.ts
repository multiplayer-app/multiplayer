import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  ErrorMessage,
  ProjectBranchCreateRequest,
  ProjectBranchCreateResponse,
  ProjectBranchStatus,
} from '@multiplayer/types'
import {
  ProjectBranchModel,
  CommitModel,
} from '@multiplayer/models'
import { commitBranchChanges } from './commit'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const payload: ProjectBranchCreateRequest = req.body

    const parentProjectBranch = await ProjectBranchModel.findProjectBranchById(payload.parentProjectBranch)
    if (!parentProjectBranch) {
      return next(new NotFoundError(ErrorMessage.INTERNAL_ERROR_NO_PARENT_BRANCH))
    }

    const parentCommit = await CommitModel.getLastCommitInBranch(payload.parentProjectBranch)

    if (
      !parentCommit
      || !parentCommit.project.equals(projectId)
    ) {
      throw new NotFoundError(ErrorMessage.INTERNAL_ERROR_NO_PARENT_COMMIT)
    }

    const _payload = {
      status: ProjectBranchStatus.IN_DEVELOPMENT,
      ...payload,
      parentCommit: parentCommit?._id,
      workspace: workspaceId,
      project: projectId,
      defaultGitBranchName: payload.name,
    }

    const projectBranch = await ProjectBranchModel.createProjectBranch(_payload)
    return res.status(200).json(projectBranch)
  } catch (err) {
    return next(err)
  }
}
