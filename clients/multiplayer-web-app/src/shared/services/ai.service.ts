import { apiInstance } from "shared/api";

export const extractPlatform = (
  workspaceId: string,
  body: FormData
): Promise<any> => {
  return apiInstance.post(`/ai/extract?workspace=${workspaceId}`, body);
};
