import type { Request, Response, NextFunction } from 'express'
import { ProjectLinkObjectType } from '@multiplayer/types'
import {
  ProjectLinkLib,
  AMQPLib,
} from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectLinkId = req.params.projectLinkId as string
    const projectBranchId = req.params.projectBranchId as string
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      projectBranch,
      projectLink,
    } = req

    await ProjectLinkLib.deleteProjectLink(
      projectBranchId,
      {
        projectLinkId,
      },
    )

    await AMQPLib.notifyOnProjectLinkDelete({
      workspaceId,
      projectId,
      branchId: projectBranchId,
      projectLinkId,
      isDefaultBranch: !!projectBranch.default,
      sourceObjectType: projectLink.sourceObjectType,
      ...projectLink.sourceObjectType === ProjectLinkObjectType.Entity
        ? { sourceObjectId: (projectLink.sourceObject as any).entityId }
        : {},
      targetObjectId: (projectLink.targetObject as any).entityId,
      ...projectLink.targetObjectType === ProjectLinkObjectType.Entity
        ? { targetObjectType: projectLink.targetObjectType }
        : {},
      sourceEntityType: projectLink.sourceEntityType,
      targetEntityType: projectLink.targetEntityType,
    })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
