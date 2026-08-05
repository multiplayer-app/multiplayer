import type { Request, Response, NextFunction } from 'express'
import { GitProviderUtil } from '../../util'
import {
  CommitContent,
  CommitContentActionEnum,
} from '../../types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repositoryId = decodeURIComponent(req.params.repositoryId as string)
    const branchId = decodeURIComponent(req.params.branchId as string)
    const integration = req.integration
    const { commitMessage } = req.body
    const contents = req.body.contents as CommitContent[]

    contents.forEach(content => {
      content.action = CommitContentActionEnum[content.action]
    })

    const commit = await GitProviderUtil.createCommit(
      integration,
      repositoryId,
      branchId,
      commitMessage,
      contents,
    )

    return res.status(200).json(commit)
  } catch (err) {
    return next(err)
  }
}
