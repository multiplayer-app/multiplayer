import type { IProject } from "@multiplayer/types";

import { getWorkspaceProjects } from "shared/services/workspace.service";

const TTL_MS = 4000;
const cache = new Map<string, { at: number; data: IProject[] }>();

/**
 * Short-lived cache to avoid duplicate project-list fetches when navigating
 * from HomeRedirect into a workspace route that immediately refetches.
 */
export const getWorkspaceProjectsNavCached = async (
  workspaceId: string
): Promise<IProject[]> => {
  const hit = cache.get(workspaceId);
  const now = Date.now();
  if (hit && now - hit.at < TTL_MS) {
    return hit.data;
  }
  const res = await getWorkspaceProjects(workspaceId, {});
  const data = (res.data || []) as IProject[];
  cache.set(workspaceId, { at: now, data });
  return data;
};

export const invalidateWorkspaceProjectsNavCache = (
  workspaceId?: string
): void => {
  if (workspaceId) {
    cache.delete(workspaceId);
  } else {
    cache.clear();
  }
};
