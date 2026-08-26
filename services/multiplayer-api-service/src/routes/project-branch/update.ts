import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { IntegrationLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const payload = req.body

    const branchBeforeUpdate = await ProjectBranchModel.findProjectBranchById(projectBranchId)

    const projectBranch = await ProjectBranchModel.updateProjectBranchById(projectBranchId, payload)

    if (
      branchBeforeUpdate
      && projectBranch
      && branchBeforeUpdate?.status !== projectBranch?.status
    ) {
      // Fired off, not awaited: ticket-status sync calls external integration APIs
      // (Atlassian/Linear), same as when this went through the `event` AMQP queue.
      IntegrationLib.syncProjectBranchTicketStatus({
        workspace: projectBranch.workspace.toString(),
        name: projectBranch.name,
        status: projectBranch.status,
      }).catch(err => logger.error(err, '[INTEGRATION] Failed to sync project branch ticket status'))
    }

    return res.status(200).json(projectBranch)
  } catch (err) {
    return next(err)
  }
}
