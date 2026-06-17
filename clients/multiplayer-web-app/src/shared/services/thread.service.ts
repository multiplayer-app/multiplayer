import { apiInstance } from "shared/api";
import {
  IGetThreadsReqParams,
  IGetCommentsReqParams,
} from "shared/models/interfaces";

export const getThreads = (
  workspaceId: string,
  projectId: string,
  params: IGetThreadsReqParams
): Promise<any> => {
  return apiInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/threads`,
    { params }
  );
};

export const getComments = (
  workspaceId: string,
  projectId: string,
  params: IGetCommentsReqParams
): Promise<any> => {
  return apiInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/comments`,
    { params }
  );
};
