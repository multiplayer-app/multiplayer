import type { Request, Response, NextFunction } from 'express'
import { s3 } from '@multiplayer/s3'
import {
  EntityCommitModel,
  EntityModel,
  IUserDocument,
  ProjectModel,
  WorkspaceUserModel,
  IEntityCommitDocument, ProjectBranchModel,
} from '@multiplayer/models'
import {
  EntityCommitStatus, EntityCommitStorageType, ErrorMessage,
} from '@multiplayer/types'
import {
  ForbiddenError,
  InvalidArgumentError,
  NotFoundError,
  FailedDependencyError, InternalServerError,
} from 'restify-errors'

export const attachEntityCommit = async (
  req: Request, res: Response, next: NextFunction,
) => {
  try {
    const entityCommitId = req.params.entityCommitId as string
    const projectId = req.params.projectId as string

    const entityCommit = await EntityCommitModel.findEntityCommitById(entityCommitId) as IEntityCommitDocument

    if (!entityCommit || !entityCommit.project.equals(projectId)) {
      return next(new NotFoundError(ErrorMessage.ENTITY_COMMIT_NOT_FOUND))
    }

    req.entityCommit = entityCommit

    next()
  } catch (err) {
    next(err)
  }
}

export const attachEntityCommits = async (req: Request, res: Response, next: NextFunction) => {
  const { entityCommits: entityCommitIds } = req.body

  const entityCommits = await EntityCommitModel.findEntityCommitByIds(entityCommitIds)

  req.entityCommits = entityCommits

  next()
}

export const validateEntityCommitsAreAttachable = async (req: Request, res: Response, next: NextFunction) => {
  const entityCommits = req.entityCommits

  if (entityCommits.some((entityCommit) =>
    entityCommit.status !== EntityCommitStatus.DONE
    || entityCommit.commit,
  )) {
    return next(new InvalidArgumentError(ErrorMessage.ENTITY_COMMIT_IS_NOT_ATTACHABLE))
  }

  next()
}

export const validateEntityCommitAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (req.isInternal) {
    return next()
  }
  const entityCommitId = req.params.entityCommitId as string
  const entityCommit = await EntityCommitModel.findEntityCommitById(entityCommitId)
  if (!entityCommit) {
    return next(new NotFoundError(ErrorMessage.ENTITY_COMMIT_NOT_FOUND))
  }

  const projectBranches = await ProjectBranchModel.getProjectBranchTree(entityCommit.projectBranch)
  const entity = await EntityModel.getEntityInBranchByEntityId(
    entityCommit.entity,
    projectBranches.map(({ _id }) => _id),
  )
  if (!entity) {
    return next(new NotFoundError(ErrorMessage.ENTITY_NOT_FOUND))
  }

  const project = await ProjectModel.findProjectById(entity.project)
  if (!project) {
    return next(new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND))
  }

  if (req.context.guest && project.access.guest.enabled) {
    return next()
  }

  const user = req.user as IUserDocument

  const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(user._id, project.workspace)
  if (!workspaceUser) {
    return next(new ForbiddenError(ErrorMessage.NO_ACCESS_TO_THE_RESOURCE))
  }

  return next()
}

export const validatEntityCommitFileUploaded = async (
  req: Request, res: Response, next: NextFunction,
) => {
  try {
    const status = req.body.status as EntityCommitStatus
    const entityCommit = req.entityCommit
    if (!entityCommit)
      return next(new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA))

    if (
      status === EntityCommitStatus.DONE
      && entityCommit.storageType === EntityCommitStorageType.S3
    ) {
      let fileUploaded = false

      try {
        await s3.headObject(
          entityCommit.bucket as string,
          entityCommit.key as string,
        )

        fileUploaded = true
      } catch (s3Error: any) {
        if (s3Error.name === 'NotFound') {
          fileUploaded = false
        } else {
          throw s3Error
        }
      }

      if (!fileUploaded) {
        throw new FailedDependencyError(ErrorMessage.CANNOT_VERIFY_COMMIT_CONTENT)
      }
    }

    return next()
  } catch (error) {
    return next(error)
  }
}
