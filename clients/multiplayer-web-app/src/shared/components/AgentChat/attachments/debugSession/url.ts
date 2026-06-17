export const getSessionUrl = (
  workspaceId?: string,
  projectId?: string,
  sessionId?: string
) => {
  if (!workspaceId || !projectId || !sessionId) {
    return window.location.href;
  }

  return `${window.location.origin}/project/${workspaceId}/${projectId}/default/debugger/session/${sessionId}`;
};
