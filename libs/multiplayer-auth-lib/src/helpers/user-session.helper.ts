import { ObjectId } from '@multiplayer/mongo'
import { UserModel, ProjectModel, WorkspaceModel } from '@multiplayer/models'
import { IUserSession } from '@multiplayer/types'
import { UserSessionCache } from '../cache'

const augmentWithMemberProjectAccess = async (
  sessions: IUserSession[],
): Promise<IUserSession[]> => {
  return Promise.all(sessions.map(async session => ({
    ...session,
    workspaces: await Promise.all(session.workspaces.map(async workspace => {
      const settings = await WorkspaceModel.getWorkspaceSettings(workspace._id)

      if (settings?.memberProjectAccess?.enabled === false) {
        return workspace
      }

      const projectRoleId = settings?.memberProjectAccess?.projectRoleId

      const coveredProjectIds = new Set<string>([
        ...workspace.projects.map(p => p._id.toString()),
        ...workspace.teams.flatMap(t => t.projects.map(id => id.toString())),
      ])

      const allProjects = await ProjectModel.getProjectsBasicInWorkspace(workspace._id)

      const extraProjects = allProjects
        .filter(p => !coveredProjectIds.has(p._id.toString()))
        .map(p => ({
          _id: p._id.toString(),
          name: p.name,
          iconUrl: p.iconUrl,
          role: projectRoleId?.toString() ?? '',
        }))

      if (!extraProjects.length) {
        return workspace
      }

      return {
        ...workspace,
        projects: [...workspace.projects, ...extraProjects],
      }
    })),
  })))
}

export const get = async (
  userIds: (string | ObjectId)[],
  workspaceIds?: string[] | ObjectId[],
): Promise<IUserSession[]> => {
  if (workspaceIds?.length) {
    const userSessions = await UserModel.getUserSession(userIds, workspaceIds)
    return augmentWithMemberProjectAccess(userSessions)
  }

  let cachedUserSessions = await Promise.all(userIds.map(userId =>
    UserSessionCache.get(userId?.toString()),
  ))

  cachedUserSessions = cachedUserSessions.filter(Boolean)

  if (cachedUserSessions.length === userIds?.length) {
    return augmentWithMemberProjectAccess(cachedUserSessions as IUserSession[])
  }

  const userSessions = await UserModel.getUserSession(userIds)

  await Promise.all(
    userSessions.map(userSession => UserSessionCache.set(
      userSession._id.toString(),
      userSession,
    )),
  )

  return augmentWithMemberProjectAccess(userSessions)
}
