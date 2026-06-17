import type { NavigateFunction } from "react-router-dom";

import type {
  IUserSession,
  IUserSessionWorkspace,
  IProject,
} from "@multiplayer/types";

import * as WorkspaceService from "shared/services/workspace.service";
import { setLastWorkspaceId } from "shared/storage/workspaceStorage";
import {
  buildProjectBasePath,
  DEFAULT_PROJECT_BRANCH_ID,
  DEFAULT_PROJECT_SOURCE_TAB,
  resolveDefaultProjectPath,
} from "./defaultProjectPath";
import { invalidateWorkspaceProjectsNavCache } from "./workspaceProjectsNavCache";

/**
 * After a workspace is created (default project exists on the server), refresh
 * sessions are already loaded — pick the new workspace, resolve its first project,
 * and go to the project route. Falls back to projects list or "/" if data is missing.
 */
export async function navigateToCreatedWorkspaceProject(params: {
  createdWorkspaceId: string;
  sessions: IUserSession[];
  navigate: NavigateFunction;
  setSession?: (s: IUserSession) => void;
  currentUserId?: string;
}): Promise<void> {
  const {
    createdWorkspaceId,
    sessions,
    navigate,
    setSession,
    currentUserId,
  } = params;

  invalidateWorkspaceProjectsNavCache(createdWorkspaceId);

  const ownerSession = sessions.find((s) =>
    s.workspaces.some((w) => w._id === createdWorkspaceId)
  );
  if (!ownerSession) {
    navigate("/", { replace: true });
    return;
  }

  if (setSession && currentUserId && ownerSession._id !== currentUserId) {
    setSession(ownerSession);
  }

  const wsEntry = ownerSession.workspaces.find(
    (w) => w._id === createdWorkspaceId
  );
  if (!wsEntry) {
    navigate("/", { replace: true });
    return;
  }

  let projectEntry: IUserSessionWorkspace["projects"][number] | null =
    wsEntry.projects?.[0] ?? null;

  if (!projectEntry) {
    try {
      const res = await WorkspaceService.getWorkspaceProjects(
        createdWorkspaceId,
        {}
      );
      const first = (res.data || [])[0] as IProject | undefined;
      if (first) {
        projectEntry = {
          _id: first._id,
          name: first.name,
          role: "",
          iconUrl: first.iconUrl,
        };
      }
    } catch {
      projectEntry = null;
    }
  }

  setLastWorkspaceId(createdWorkspaceId);

  if (projectEntry) {
    const path = resolveDefaultProjectPath(
      ownerSession._id,
      wsEntry._id,
      [{ _id: projectEntry._id, name: projectEntry.name } as IProject],
      false,
      projectEntry._id,
      DEFAULT_PROJECT_BRANCH_ID
    );
    const fallback = `${buildProjectBasePath(
      wsEntry._id,
      projectEntry._id,
      DEFAULT_PROJECT_BRANCH_ID,
      false
    )}/${DEFAULT_PROJECT_SOURCE_TAB}`;
    navigate(path || fallback, { replace: true });
    return;
  }

  navigate(`/project/${createdWorkspaceId}/projects`, { replace: true });
}
