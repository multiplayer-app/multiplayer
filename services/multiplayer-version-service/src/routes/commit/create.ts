import type { Request, Response, NextFunction } from 'express'
import { ErrorMessage } from '@multiplayer/types'
import { IEntityCommitDocument } from '@multiplayer/models'
import { InternalServerError } from 'restify-errors'
import { AMQPLib, CommitLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body
    const {
      projectBranch,
      lastCommit,
      entityCommits,
      projectBranchState,
    } = req

    if (
      !projectBranchState
      || !entityCommits
      || !projectBranch
      || !lastCommit
    ) {
      throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
    }

    const commit = await CommitLib.createCommit({
      projectBranch,
      lastCommit,
      entityCommits,
      projectBranchState,
      message: payload.message,
      label: payload.label,
      type: payload.type,
      workspaceUsers: payload.workspaceUsers,
    })

    await AMQPLib.notifyOnCommit({
      commit,
      entityCommits: commit.entityCommits as any as IEntityCommitDocument[],
      isDefaultBranch: !!projectBranch.default,
    })

    commit.entityCommits.forEach((entityCommit: any) => {
      entityCommit.entity = entityCommit.entity.entityId
    })

    return res.status(200).json(commit)
  } catch (err) {
    return next(err)
  }
}
