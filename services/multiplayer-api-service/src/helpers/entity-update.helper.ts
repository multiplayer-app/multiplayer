export const getS3Key = ({
  workspaceId,
  projectId,
  entityId,
  entityUpdateId,
}: {
  workspaceId: string,
  projectId: string,
  entityId: string,
  entityUpdateId?: string,
}): string => {
  let s3Key = `workspaces/${workspaceId}/projects/${projectId}/entities/${entityId}/updates`

  if (entityUpdateId) {
    s3Key += `/${entityUpdateId}`
  }

  return s3Key
}
