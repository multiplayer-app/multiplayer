import type { Request, Response, NextFunction } from 'express'
import { WorkspaceLib } from '../lib'

export const attachWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string

    const workspace = await WorkspaceLib.getWorkspaceById(workspaceId)

    req.workspace = workspace

    next()
  } catch (error) {
    next(error)
  }
}
