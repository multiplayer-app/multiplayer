import type { IProject } from "@multiplayer/types";

import {
  buildProjectBasePath,
  DEFAULT_PROJECT_BRANCH_ID,
  pickProjectAndBranch,
} from "shared/navigation/defaultProjectPath";

/**
 * Canonical settings root lives under project routes:
 * `/project/:workspaceId/:projectId/:branchId/settings`
 *
 * If project context is unavailable, route to not found.
 */
export const workspaceSettingsRootPath = (
  workspaceId: string,
  projects?: Partial<IProject>[] | null,
  isPublic = false
): string => {
  const picked = pickProjectAndBranch(workspaceId, projects || []);
  if (!picked) {
    return "/not-found";
  }
  return `${buildProjectBasePath(
    workspaceId,
    picked.projectId,
    picked.branchId,
    isPublic
  )}/settings`;
};

export const workspaceSettingsHref = (
  workspaceId: string,
  relativePath = "",
  projects?: Partial<IProject>[] | null,
  isPublic = false
): string => {
  const root = workspaceSettingsRootPath(workspaceId, projects, isPublic);
  const rel = relativePath.replace(/^\/+/, "");
  if (root === "/not-found") {
    return "/not-found";
  }
  if (!rel) {
    return root;
  }
  return `${root}/${rel}`;
};

/**
 * Resolves account settings URLs under `/project/:ws/:project/:branch/settings/...`.
 * Uses route params when available (header on a project branch); otherwise falls back
 * to picking a project from `fallbackProjects` (e.g. session workspace.projects).
 */
export const resolveWorkspaceSettingsHref = (
  workspaceId: string,
  relativePath: string,
  options: {
    isPublic?: boolean;
    routeWorkspaceId?: string;
    routeProjectId?: string;
    routeBranchId?: string;
    fallbackProjects?: Partial<IProject>[] | null;
  } = {}
): string => {
  const isPublic = options.isPublic ?? false;
  const rel = relativePath.replace(/^\/+/, "");

  const rw = options.routeWorkspaceId;
  const workspaceMatches =
    rw === undefined || rw === "" || rw === workspaceId;

  if (
    workspaceMatches &&
    options.routeProjectId &&
    options.routeBranchId
  ) {
    return `${buildProjectBasePath(
      workspaceId,
      options.routeProjectId,
      options.routeBranchId,
      isPublic
    )}/settings/${rel}`;
  }

  return workspaceSettingsHref(
    workspaceId,
    rel,
    options.fallbackProjects ?? null,
    isPublic
  );
};

/** Workspace settings → project admin for a specific project (default branch). */
export const workspaceProjectSettingsPath = (
  workspaceId: string,
  projectId: string,
  _branchId: string = DEFAULT_PROJECT_BRANCH_ID,
  _isPublic = false
): string =>
  `${buildProjectBasePath(
    workspaceId,
    projectId,
    DEFAULT_PROJECT_BRANCH_ID,
    false
  )}/settings/project`;
