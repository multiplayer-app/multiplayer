import type { Request, Response, NextFunction } from 'express'
import { AccessControlRoleUtil } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string

    const projectRoleIds = req.context.projects
      .find(projectContext => projectContext.projectId === projectId)
      ?.projectRoleIds || []

    const aggregatedRole = AccessControlRoleUtil.getProjectAggregatedAccessActions(
      projectRoleIds,
      req.context,
    )

    return res.status(200).json(aggregatedRole)
  } catch (err) {
    return next(err)
  }
}
