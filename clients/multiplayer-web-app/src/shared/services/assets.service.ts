import { assetsInstance } from "shared/api";

export const getSessionNotesContent = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string
): Promise<any> => {
  return assetsInstance.get(`/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/notes/content`);
};
