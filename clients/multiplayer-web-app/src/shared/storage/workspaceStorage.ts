const LAST_WORKSPACE_ID_KEY = 'lastWorkspaceId';

export const setLastWorkspaceId = (workspaceId: string): void => {
  try {
    localStorage.setItem(LAST_WORKSPACE_ID_KEY, workspaceId);
  } catch (error) {
    console.warn('Failed to store last workspace ID:', error);
  }
};

export const getLastWorkspaceId = (): string | null => {
  try {
    return localStorage.getItem(LAST_WORKSPACE_ID_KEY);
  } catch (error) {
    console.warn('Failed to retrieve last workspace ID:', error);
    return null;
  }
};

export const clearLastWorkspaceId = (): void => {
  try {
    localStorage.removeItem(LAST_WORKSPACE_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear last workspace ID:', error);
  }
};

export const isWorkspaceValid = (
  workspaceId: string,
  userWorkspaces: Array<{ _id: string }>
): boolean => {
  if (!workspaceId || !userWorkspaces || !Array.isArray(userWorkspaces)) {
    return false;
  }

  return userWorkspaces.some(workspace => workspace._id === workspaceId);
};

export const getWorkspaceId = (userWorkspaces: Array<{ _id: string }>): string | null => {
  if (!userWorkspaces?.length) {
    return null;
  }
  const lastWorkspaceId = getLastWorkspaceId();
  if (lastWorkspaceId && isWorkspaceValid(lastWorkspaceId, userWorkspaces)) {
    return lastWorkspaceId;
  }
  return userWorkspaces[0]._id;
}