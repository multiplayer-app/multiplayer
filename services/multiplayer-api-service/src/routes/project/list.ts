import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessibleTeamIds = req.context.teams.map(({ teamId }) => teamId)
    const workspaceId = req.params.workspaceId as string
    const context = req.context
    const archived = Boolean(req.query.archived)
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query ? Number(req.query.limit) : undefined

    const filter: {
      _ids?: string[],
      archived?: boolean
    } = {
      archived,
    }

    if (
      !context.workspaceOwner
      && !context.workspaceAdmin
      && !context.superAdmin
    ) {
      filter._ids = context.projects.map(({ projectId }) => projectId)
    }

    const projects = await ProjectModel.findProjects(
      workspaceId,
      filter,
      {
        skip,
        limit,
      },
      true,
    )

    if (
      !context.workspaceAdmin
      && !context.workspaceOwner
      && !context.superAdmin
    ) {
      projects.data = projects.data.map(project => {
        project.teams = project.teams.filter(team => accessibleTeamIds.find(id => (team as any)._id.equals(id)))

        project.access = {
          ...(project.access || {}),
          guest: {
            enabled: project.access?.guest?.enabled || false,
          },
        }

        return project
      })
    }

    return res.status(200).json(projects)
  } catch (err) {
    return next(err)
  }
}
