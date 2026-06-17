import NodeCache from 'node-cache'

const projectBranchCache = new NodeCache({ stdTTL: 15 })

export const get = (projectBranchId: string): string | undefined => {
  const projectId = projectBranchCache.get(projectBranchId)

  return projectId as string | undefined
}

export const set = (
  projectBranchId: string,
  projectId: string,
): void => {
  projectBranchCache.set(
    projectId,
    projectBranchId,
  )
}
