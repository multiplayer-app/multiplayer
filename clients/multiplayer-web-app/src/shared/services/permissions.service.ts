import { DataWithCursor, IRole } from "@multiplayer/types";
import { apiInstance } from "shared/api";

export const getRoles = (workspaceId: string): Promise<DataWithCursor<IRole>> => {
  return apiInstance.get(`/workspaces/${workspaceId}/roles`);
};
