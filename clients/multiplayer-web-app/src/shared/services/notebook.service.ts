import { notebookInstance } from '../api'

export const getTemporaryApiKey = (workspaceId: string, projectId: string): Promise<string> => {
  return notebookInstance.post(`/workspaces/${workspaceId}/projects/${projectId}/api-key`);
};
