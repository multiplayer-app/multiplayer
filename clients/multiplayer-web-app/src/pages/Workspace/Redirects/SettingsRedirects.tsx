import { Navigate, useLocation, useParams } from "react-router-dom";

import PageLoading from "shared/components/PageLoading";
import {
  buildProjectBasePath,
  pickProjectAndBranch,
} from "shared/navigation/defaultProjectPath";
import { useWorkspace } from "shared/providers/WorkspaceContext";

/** Old `/project/.../workspace-settings` URLs → `/project/.../settings`. */
export const ProjectWorkspaceSettingsRedirect = () => {
  const { workspaceId, projectId, branchId } = useParams();
  const location = useLocation();
  if (!workspaceId || !projectId || !branchId) {
    return <Navigate to="/not-found" replace />;
  }
  const isPublic = location.pathname.startsWith("/public/");
  const prefix = `${
    isPublic ? "/public" : ""
  }/project/${workspaceId}/${projectId}/${branchId}/workspace-settings`;
  if (!location.pathname.startsWith(prefix)) {
    return <Navigate to="/not-found" replace />;
  }
  const rest = location.pathname.slice(prefix.length);
  const tail = rest.startsWith("/") ? rest : rest ? `/${rest}` : "";
  return (
    <Navigate
      to={{
        pathname: `${isPublic ? "/public" : ""}/project/${workspaceId}/${projectId}/${branchId}/settings${tail}`,
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
};

/** Old `/dashboard/:workspaceId/settings/*` URLs → canonical project settings URL. */
export const DashboardSettingsRedirect = () => {
  const { workspaceId } = useParams();
  const location = useLocation();
  const { projects } = useWorkspace();

  if (!workspaceId) {
    return <Navigate to="/not-found" replace />;
  }

  if (!projects.fetched) {
    return <PageLoading />;
  }

  const picked = pickProjectAndBranch(workspaceId, projects.data || []);
  if (!picked) {
    return <Navigate to="/not-found" replace />;
  }

  const prefix = `/dashboard/${workspaceId}/settings`;
  const rest = location.pathname.startsWith(prefix)
    ? location.pathname.slice(prefix.length)
    : "";
  const tail = rest.startsWith("/") ? rest : rest ? `/${rest}` : "";
  const basePath = buildProjectBasePath(
    workspaceId,
    picked.projectId,
    picked.branchId
  );

  return (
    <Navigate
      to={{
        pathname: `${basePath}/settings${tail}`,
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
};
