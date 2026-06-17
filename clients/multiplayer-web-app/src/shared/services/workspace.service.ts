import { IAccess, IProject, IWorkspaceSettings } from "@multiplayer/types";
import { apiInstance } from "shared/api";
import { IReqParamsBase } from "shared/models/interfaces";
import { memoizeApiFunction } from "shared/helpers/api.helpers";

export const getWorkspace = (workspaceId: string): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}`);
};

export const getWorkspaceAccount = (workspaceId: string): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/billing/account`);
};

export const getWorkspaceBilling = (workspaceId: string): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/billing`);
};

export const createWorkspace = (body: {
  name: string;
  handle?: string;
}): Promise<any> => {
  return apiInstance.post("/workspaces", {
    ...body,
    // billing: {
    //   stripe: {
    //     priceId: config.REACT_APP_STRIPE_DEFAULT_PRO_PRICE_ID,
    //   },
    // },
  });
};

export const resendWorkspaceInvitation = (
  workspaceId: string,
  workspaceMemberId: string
): Promise<any> => {
  return apiInstance.post(
    `/workspaces/${workspaceId}/users/${workspaceMemberId}/invitation/resend`
  );
};

export const updateWorkspace = (
  workspaceId: string,
  body: {
    name?: string;
    handle?: string;
    isWorkspaceOnboarded?: boolean;
    settings?: Partial<IWorkspaceSettings>;
  }
): Promise<any> => {
  return apiInstance.patch(`/workspaces/${workspaceId}`, body);
};

export const updateWorkspaceIcon = (
  workspaceId: string,
  file
): Promise<any> => {
  return apiInstance.patch(`/workspaces/${workspaceId}/icon`, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
};

export const deleteWorkspace = (workspaceId: string): Promise<any> => {
  return apiInstance.delete(`/workspaces/${workspaceId}`);
};

export const getWorkspaceUsers = (
  workspaceId: string,
  params = {}
): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/users`, { params });
};

export const inviteWorkspaceMembers = (
  workspaceId: string,
  body: {
    emails: string[];
    teams?: string[];
    role?: string;
  }
): Promise<any> => {
  return apiInstance.post(`/workspaces/${workspaceId}/users`, body);
};

export const updateWorkspaceMembers = (
  workspaceId: string,
  userId: string,
  body: { role: string }
): Promise<any> => {
  return apiInstance.patch(`/workspaces/${workspaceId}/users/${userId}`, body);
};

export const deleteWorkspaceMembers = (
  workspaceId: string,
  userId: string
): Promise<any> => {
  return apiInstance.delete(`/workspaces/${workspaceId}/users/${userId}`);
};

export const leaveWorkspace = (workspaceId: string): Promise<any> => {
  return apiInstance.delete(`/workspaces/${workspaceId}/users/leave`);
};

export const addWorkspaceDomain = (
  workspaceId: string,
  body: { domain: string; email: string }
): Promise<any> => {
  return apiInstance.post(`/workspaces/${workspaceId}/domains`, body);
};

export const confirmWorkspaceDomain = (
  workspaceId: string,
  body: { code: string }
): Promise<any> => {
  return apiInstance.post(`/workspaces/${workspaceId}/domains/confirm`, body);
};

export const deleteWorkspaceDomain = (
  workspaceId: string,
  domainId: string
): Promise<any> => {
  return apiInstance.delete(`/workspaces/${workspaceId}/domains/${domainId}`);
};

// Team endpoints
export const getTeams = (workspaceId: string): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/teams`);
};

export const createTeam = (
  workspaceId: string,
  body: { name: string }
): Promise<any> => {
  return apiInstance.post(`/workspaces/${workspaceId}/teams`, body);
};

export const getTeam = (workspaceId: string, teamId: string): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/teams/${teamId}`);
};

export const updateTeam = (
  workspaceId: string,
  teamId: string,
  body: { name: string }
): Promise<any> => {
  return apiInstance.patch(`/workspaces/${workspaceId}/teams/${teamId}`, body);
};

export const updateTeamIcon = (
  workspaceId: string,
  teamId: string,
  file
): Promise<any> => {
  return apiInstance.patch(
    `/workspaces/${workspaceId}/teams/${teamId}/icon`,
    file,
    {
      headers: {
        "Content-Type": file.type,
      },
    }
  );
};

export const deleteTeam = (
  workspaceId: string,
  teamId: string
): Promise<any> => {
  return apiInstance.delete(`/workspaces/${workspaceId}/teams/${teamId}`);
};

export const getTeamMembers = (
  workspaceId: string,
  teamId: string
): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/teams/${teamId}/users`);
};

export const inviteTeamMembers = (
  workspaceId: string,
  teamId: string,
  body: { emails: string[] }
): Promise<any> => {
  return apiInstance.post(
    `/workspaces/${workspaceId}/teams/${teamId}/users`,
    body
  );
};

export const deleteTeamMembers = (
  workspaceId: string,
  teamId: string,
  userId: string
): Promise<any> => {
  return apiInstance.delete(
    `/workspaces/${workspaceId}/teams/${teamId}/users/${userId}`
  );
};

export const updateTeamMembers = (
  workspaceId: string,
  teamId: string,
  userId: string,
  body: { role: string }
): Promise<any> => {
  return apiInstance.patch(
    `/workspaces/${workspaceId}/teams/${teamId}/users/${userId}`,
    body
  );
};

export const updateProjectMember = (
  workspaceId: string,
  projectId: string,
  projectUserId: string,
  body: { role: string }
): Promise<any> => {
  return apiInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/users/${projectUserId}`,
    body
  );
};

export const addProjectToTeam = (
  workspaceId: string,
  teamId: string,
  projectId: string
): Promise<any> => {
  return apiInstance.post(
    `/workspaces/${workspaceId}/teams/${teamId}/projects`,
    { project: projectId }
  );
};

export const removeProjectFromTeam = (
  workspaceId: string,
  projectId: string,
  teamId: string
): Promise<any> => {
  return apiInstance.delete(
    `/workspaces/${workspaceId}/teams/${teamId}/projects`,
    { data: { project: projectId } }
  );
};

// Project endpoints

export const getProjects = (
  workspaceId: string,
  teamId: string
): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/teams/${teamId}/projects`);
};

export const getWorkspaceProjects = (
  workspaceId: string,
  params?: IReqParamsBase
): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/projects`, { params });
};

export const createProject = (
  workspaceId: string,
  body: { name: string; version?: string }
): Promise<any> => {
  return apiInstance.post(`/workspaces/${workspaceId}/projects`, body);
};

export const addUserToProject = (
  workspaceId: string,
  projectId: string,
  body: {
    email: string;
    role: string;
  }
): Promise<any> => {
  return apiInstance.post(
    `workspaces/${workspaceId}/projects/${projectId}/users`,
    body
  );
};

export const removeUserFromProject = (
  workspaceId: string,
  projectId: string,
  projectUserId: string
): Promise<any> => {
  return apiInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/users/${projectUserId}`
  );
};

export const getProject = (
  workspaceId: string,
  projectId: string
): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/projects/${projectId}`);
};

export const updateProject = (
  workspaceId: string,
  projectId: string,
  body: Partial<IProject>
): Promise<any> => {
  return apiInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    body
  );
};

export const deleteProject = (
  workspaceId: string,
  projectId: string
): Promise<any> => {
  return apiInstance.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
};

export const updateProjectAccess = (
  workspaceId: string,
  projectId: string,
  access: Partial<IAccess>
): Promise<any> => {
  return apiInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/access`,
    access
  );
};

export const updateProjectIcon = (
  workspaceId: string,
  projectId: string,
  file
): Promise<any> => {
  return apiInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/icon`,
    file,
    {
      headers: {
        "Content-Type": file.type,
      },
    }
  );
};

export const updateProjectCover = (
  workspaceId: string,
  projectId: string,
  file
): Promise<any> => {
  return apiInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/cover-image`,
    file,
    {
      headers: {
        "Content-Type": file.type,
      },
    }
  );
};

// Account endpoints
export const getAccount = (accountId: string): Promise<any> => {
  return apiInstance.get(`/accounts/${accountId}`);
};

export const getAccountCustomerPortalUrl = (
  accountId: string
): Promise<any> => {
  return apiInstance.get(`/accounts/${accountId}/billing/customer-portal`);
};

export const getWorkspaceCustomerPortalUrl = (
  workspaceId: string
): Promise<any> => {
  return apiInstance.get(`/workspaces/${workspaceId}/billing/customer-portal`);
};

// Delete Comment.
export const deleteComment = (workspaceId: string, tagId: string) => {
  return apiInstance.delete(`/workspaces/${workspaceId}/tags/${tagId}`);
};

export const getAccountRole = memoizeApiFunction(
  (accountId: string): Promise<any> => {
    return apiInstance.get(`/accounts/${accountId}/role`);
  }
);

export const getWorkspaceRole = memoizeApiFunction(
  (workspaceId: string): Promise<any> => {
    return apiInstance.get(`/workspaces/${workspaceId}/role`);
  }
);

export const getProjectRole = memoizeApiFunction(
  (workspaceId: string, projectId: string): Promise<any> => {
    return apiInstance.get(
      `/workspaces/${workspaceId}/projects/${projectId}/role`
    );
  }
);

export const getAllWorkspaces = (params?: IReqParamsBase): Promise<any> => {
  return apiInstance.get("/workspaces/all", { params });
};

export const updateFeatureAccess = (
  workspaceId: string,
  flag: string,
  enabled: boolean
): Promise<any> => {
  return apiInstance.patch("/workspaces/feature", {
    workspaceId,
    flag,
    enabled,
  });
};
