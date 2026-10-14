export const getS3Key = ({
  workspaceId,
  projectId,
  entityId,
  entityCommitId,
}: {
  workspaceId: string,
  projectId: string,
  entityId: string,
  entityCommitId: string,
}): string => {
  return `workspaces/${workspaceId}/projects/${projectId}/entities/${entityId}/entity-commits/${entityCommitId}`
}
