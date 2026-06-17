export const getS3Key = ({
  workspaceId,
  projectId,
  releaseId,
  entityId,
  filePath,
}: {
  workspaceId: string,
  projectId: string,
  releaseId: string,
  entityId: string,
  filePath: string,
}): string => {
  const key = filePath.startsWith('/') ? filePath.slice(1) : filePath

  return `workspaces/${workspaceId}/projects/${projectId}/releases/${releaseId}/entities/${entityId}/${key}`
}
