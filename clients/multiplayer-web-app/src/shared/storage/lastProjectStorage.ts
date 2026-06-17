const LAST_PROJECT_KEY = "lastProjectContext";

export type LastProjectContext = {
  workspaceId: string;
  projectId: string;
  branchId: string;
};

export const setLastProjectContext = (ctx: LastProjectContext): void => {
  try {
    localStorage.setItem(LAST_PROJECT_KEY, JSON.stringify(ctx));
  } catch (error) {
    console.warn("Failed to store last project context:", error);
  }
};

export const getLastProjectContext = (): LastProjectContext | null => {
  try {
    const raw = localStorage.getItem(LAST_PROJECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastProjectContext;
    if (!parsed?.workspaceId || !parsed?.projectId || !parsed?.branchId) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to read last project context:", error);
    return null;
  }
};
