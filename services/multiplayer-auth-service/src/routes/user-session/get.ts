import { Request, Response, NextFunction } from 'express'
import { UserSessionHelper } from '@multiplayer/auth'
import { IUserSession, TokenTypeEnum } from '@multiplayer/types'

const filterSessionData = (
  sessions: IUserSession[],
  workspaceId: string | undefined,
  projectId: string | undefined,
): IUserSession[] => {
  return sessions
    .map(session => ({
      ...session,
      workspaces: workspaceId ? session.workspaces
        .filter(_workspace => _workspace._id === workspaceId)
        .map(ws => ({
          ...ws,
          teams: projectId ? ws.teams.filter(team =>
            team.projects.includes(projectId),
          ) : [],
          projects: projectId ? ws.projects.filter(project =>
            project._id === projectId,
          ) : [],
        })) : [],
    }))
    .filter(session => session.workspaces.length > 0)
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session?.users?.length) {
      const response = { sessions: [] as IUserSession[] }

      if (
        req.rawToken?.type === TokenTypeEnum.OAUTH_ACCESS_TOKEN
        && req.rawToken?.user
      ) {
        const sessions = await UserSessionHelper.get([req.rawToken.user as string])
        if (req.rawToken.meta.workspace || req.rawToken.meta.project) {
          response.sessions = filterSessionData(
            sessions,
            req.rawToken.meta.workspace,
            req.rawToken.meta.project)
        } else {
          response.sessions = sessions
        }
      }

      return res.status(200).json(response)
    }

    const sessions = await UserSessionHelper.get(req.session.users)

    return res.status(200).json({ sessions })
  } catch (err) {
    return next(err)
  }
}
