import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchModel } from '@multiplayer/models'
import {
  CollaborationAMQPMessageType,
  ProjectBranchUpdatedEventMessage,
} from '@multiplayer/types'
import AMQP from '@multiplayer/amqp'
import { AMQP_EVENT_QUEUE } from '../../config'

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
      await AMQP.publish(
        AMQP_EVENT_QUEUE,
        {
          type: CollaborationAMQPMessageType.PROJECT_BRANCH_UPDATE,
          variables: {
            projectBranch: {
              _id: projectBranch._id.toString(),
              workspace: projectBranch.workspace.toString(),
              project: projectBranch.project.toString(),
              name: projectBranch.name,
              status: projectBranch.status,
            },
          },
        } as ProjectBranchUpdatedEventMessage,
        { durable: true, fanout: true },
      )
    }

    return res.status(200).json(projectBranch)
  } catch (err) {
    return next(err)
  }
}
