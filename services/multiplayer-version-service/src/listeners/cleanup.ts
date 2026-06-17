import { CleanupUtil } from '../utils'

export default async (message: any) => {
  const {
    workspace,
    project,
    type,
  } = message?.variables || {}

  if (type === 'PROJECT') {
    await CleanupUtil.cleanupProject(workspace, project)
  } else if (type === 'WORKSPACE') {
    await CleanupUtil.cleanupWorkspace(workspace)
  }
}
