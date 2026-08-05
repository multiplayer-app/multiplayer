import type { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import {
  ProjectLinkModel,
  IProjectLinkDocument,
} from '@multiplayer/models'
import { IProjectLink } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastCommit = req.lastCommit
    const projectLinkBeforeUpdate = req.projectLink
    const projectLinkId = req.params.projectLinkId as string
    const projectBranchId = req.params.projectBranchId as string
    const {
      archived,
      ..._payload
    }: Omit<IProjectLink, '_id'> & { archived: boolean } = req.body

    if (typeof archived === 'boolean') {
      if (archived) {
        _payload.archivedAtCommit = lastCommit._id.toString()
      } else {
        _payload.archivedAtCommit = undefined
      }
    }

    if ((projectLinkBeforeUpdate.projectBranch as Types.ObjectId).equals(projectBranchId)) {
      await ProjectLinkModel.updateProjectLinkById(
        projectLinkId,
        projectBranchId,
        _payload,
      )
    } else {
      const {
        _id,
        ...oldProjectLinkObject
      } = projectLinkBeforeUpdate

      await ProjectLinkModel.createProjectLink(
        {
          ...oldProjectLinkObject as Omit<IProjectLinkDocument, '_id'>,
          ..._payload,
          workspace: oldProjectLinkObject.workspace,
          project: oldProjectLinkObject.project,
          projectBranch: projectBranchId,
        },
      )
    }

    const projectLink = await ProjectLinkModel.findProjectLinkById(
      projectLinkId,
      [projectBranchId],
    )

    return res.status(200).json(projectLink)
  } catch (err) {
    return next(err)
  }
}
