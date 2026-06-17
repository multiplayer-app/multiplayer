import NodeCache from 'node-cache'

const defaultProjectBranchCache = new NodeCache({ stdTTL: 15 })

export const get = (projectId: string): string | undefined => {
  const defaultProjectBranchId = defaultProjectBranchCache.get(projectId)

  return defaultProjectBranchId as string | undefined
}

export const set = (
  projectId: string,
  defaultProjectBranchId: string,
): void => {
  defaultProjectBranchCache.set(
    projectId,
    defaultProjectBranchId,
  )
}
