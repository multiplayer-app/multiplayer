import { NotFoundError } from 'restify-errors'
import { Types } from 'mongoose'
import {
  ProjectModel,
  IProjectDocument,
} from '@multiplayer/models'

export const getProjectById = async (
  projectId: string | Types.ObjectId,
): Promise<IProjectDocument> => {
  const project = await ProjectModel.findProjectById(projectId)

  if (!project) {
    throw new NotFoundError('Project not found')
  }

  return project
}

// Trace links point into the project's own infrastructure (internal hosts, datasource ids): they
// are left out of every project response to viewers of a public project
export const forViewer = <T extends { settings?: { traceLinks?: unknown } }>(
  req: { user?: { guest?: boolean }, context?: { guest?: boolean } },
  project: T,
): T => {
  if (!(req.user?.guest || req.context?.guest) || !project?.settings) {
    return project
  }

  const { traceLinks, ...settings } = project.settings
  return { ...project, settings }
}
