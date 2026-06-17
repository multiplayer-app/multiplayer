import { useParams } from "react-router-dom";

import { workspaceProjectSettingsPath } from "shared/navigation/workspaceSettingsPath";
import { usePublicRoute } from "./usePublicRoute";

/**
 * `/project/:workspaceId/:projectId/.../settings/project` from current route params.
 * `basePath` and `segmentPath` are `null` when workspace or project id is missing.
 */
export const useProjectSettingsPath = () => {
  const { workspaceId, projectId, branchId } = useParams();
  const { isPublic } = usePublicRoute();

  const basePath =
    workspaceId && projectId
      ? workspaceProjectSettingsPath(workspaceId, projectId, branchId, isPublic)
      : null;

  const segmentPath = (segment: string): string | null => {
    if (!basePath) return null;
    const s = segment.replace(/^\/+/, "");
    return s ? `${basePath}/${s}` : basePath;
  };

  return { basePath, segmentPath, workspaceId, projectId, branchId };
};
