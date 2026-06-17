import type { IProject } from "@multiplayer/types";

import { getProjectLastVisitedPath } from "shared/storage/projectStorage";
import { getLastProjectContext } from "shared/storage/lastProjectStorage";

export const DEFAULT_PROJECT_BRANCH_ID = "default";
export const DEFAULT_PROJECT_SOURCE_TAB = "agents";

export const buildProjectBasePath = (
  workspaceId: string,
  projectId: string,
  branchId: string,
  isPublic = false
): string => {
  const prefix = isPublic ? "/public" : "";
  return `${prefix}/project/${workspaceId}/${projectId}/${branchId}`;
};

/**
 * Picks project + branch from URL params first (caller passes those),
 * otherwise last stored context for this workspace, otherwise first project.
 */
export const pickProjectAndBranch = (
  workspaceId: string,
  projects: Partial<IProject>[],
  routeProjectId?: string,
  routeBranchId?: string
): { projectId: string; branchId: string } | null => {
  if (!projects?.length) return null;

  if (routeProjectId && projects.some((p) => p._id === routeProjectId)) {
    return {
      projectId: routeProjectId,
      branchId: routeBranchId || DEFAULT_PROJECT_BRANCH_ID,
    };
  }

  const stored = getLastProjectContext();
  if (
    stored?.workspaceId === workspaceId &&
    stored.projectId &&
    projects.some((p) => p._id === stored.projectId)
  ) {
    return {
      projectId: stored.projectId,
      branchId: stored.branchId || DEFAULT_PROJECT_BRANCH_ID,
    };
  }

  return {
    projectId: projects[0]._id,
    branchId: DEFAULT_PROJECT_BRANCH_ID,
  };
};

export const resolveDefaultProjectPath = (
  userId: string | undefined,
  workspaceId: string,
  projects: Partial<IProject>[],
  isPublic = false,
  routeProjectId?: string,
  routeBranchId?: string
): string | null => {
  const picked = pickProjectAndBranch(
    workspaceId,
    projects,
    routeProjectId,
    routeBranchId
  );
  if (!picked) return null;

  const base = buildProjectBasePath(
    workspaceId,
    picked.projectId,
    picked.branchId,
    isPublic
  );

  if (userId) {
    const lastVisited = getProjectLastVisitedPath(
      `${userId}_${picked.projectId}`
    );
    if (lastVisited.startsWith(base + "/")) {
      return lastVisited;
    }
  }

  return `${base}/${DEFAULT_PROJECT_SOURCE_TAB}`;
};
