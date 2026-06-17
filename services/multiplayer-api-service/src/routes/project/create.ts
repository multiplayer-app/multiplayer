import type { Request, Response, NextFunction } from 'express'
import { AccessControlContext } from '@multiplayer/auth'
import { NotFoundError } from 'restify-errors'
import {
  ProjectModel,
  ProjectBranchModel,
  CommitModel,
  RoleModel,
} from '@multiplayer/models'
import {
  ProjectBranchStatus,
  ProjectBranchType,
  CommitType,
  EntityType,
  IProject,
  IssueCategoryEnum,
  RoleType,
} from '@multiplayer/types'
import { multiplayerInternalVersionService } from '../../services'
import {
  DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _payload = req.body
    const workspaceId = req.params.workspaceId as string

    let guestRoleId = _payload.access?.guest?.role

    if (!guestRoleId) {
      const guestRole = await RoleModel.findReadOnlyRole(RoleType.PROJECT)

      if (!guestRole) {
        throw new NotFoundError('Guest role not found')
      }

      guestRoleId = guestRole._id.toString()
    }

    const payload: Partial<IProject> = {
      ..._payload,
      workspace: workspaceId,
      settings: {
        agent: {
          fixabilityScoreThreshold: _payload.settings?.agent?.fixabilityScoreThreshold || DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD,
        },
        issue: {
          createOnlyForCategories: _payload.settings?.issue?.createOnlyForCategories || [
            IssueCategoryEnum.ERROR,
            IssueCategoryEnum.EXCEPTION,
          ],
        },
      },
      access: {
        ...(_payload.access || {}),
        guest: {
          enabled: _payload.access?.guest?.enabled || false,
          role: guestRoleId,
        },
      },
    }

    const project = await ProjectModel.createProject(payload)

    const branchPayload = {
      workspace: workspaceId,
      project: project._id,
      name: 'main',
      default: true,
      type: ProjectBranchType.CHANGE,
      status: ProjectBranchStatus.IN_PROGRESS,
    }
    const defaultBranch = await ProjectBranchModel.createProjectBranch(branchPayload)

    const commitPayload = {
      workspace: workspaceId,
      project: project._id,
      projectBranch: defaultBranch,
      type: CommitType.AUTO,
      message: 'Initial commit (Project created).',
    }
    await CommitModel.createCommit(commitPayload)

    await multiplayerInternalVersionService.createEntity({
      workspaceId: workspaceId.toString(),
      projectId: project._id.toString(),
      branchId: defaultBranch._id.toString(),
      payload: {
        key: 'system-map',
        type: EntityType.PLATFORM,
        archived: false,
        default: true,
      },
    })

    await AccessControlContext.invalidateContext({ workspaceId })

    return res.status(200).json(project)
  } catch (err) {
    return next(err)
  }
}
