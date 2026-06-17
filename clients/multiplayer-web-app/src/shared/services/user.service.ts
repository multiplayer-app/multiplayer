import { apiInstance } from "shared/api";

/**
 * Retrieves the current user.
 * @returns A promise that resolves to the current user.
 */
export const getCurrentUser = (): Promise<any> => {
  return apiInstance.get("/users/current");
};

/**
 * Retrieves the user settings for a specific workspace.
 * @param workspaceId - The ID of the workspace.
 * @returns A promise that resolves to the user settings for the workspace.
 */
export const getWorkspaceUser = (workspaceId): Promise<any> => {
  return apiInstance.get(`/users/current/workspace-settings/${workspaceId}`);
};

/**
 * Updates the user settings for a specific workspace.
 * @param workspaceId - The ID of the workspace.
 * @param body - Request body containing the updates to apply.
 * @returns A promise that resolves when the user settings are successfully updated.
 */
export const updateWorkspaceUser = (workspaceId, body): Promise<any> => {
  return apiInstance.patch(
    `/users/current/workspace-settings/${workspaceId}`,
    body
  );
};

/**
 * Updates the user avatar for a specific workspace.
 * @param workspaceId - The ID of the workspace.
 * @param file - The file representing the new avatar image.
 * @returns A promise that resolves when the user avatar is successfully updated.
 */
export const updateWorkspaceUserAvatar = (workspaceId, file): Promise<any> => {
  return apiInstance.patch(
    `/users/current/workspace-settings/${workspaceId}/icon`,
    file,
    {
      headers: {
        "Content-Type": file.type,
      },
    }
  );
};
