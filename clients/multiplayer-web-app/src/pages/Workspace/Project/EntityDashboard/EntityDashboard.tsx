import { useMemo, memo } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import {
  entityCategoryMap,
  projectCategoryConfigs,
} from "shared/configs/project";
import { NavBarItemType } from "shared/models/interfaces";
import CheckFeature from "shared/components/CheckFeature";

import EntityEditor from "./EntityEditor";
import EntityDashboardContent from "./EntityDashboardContent";

const PUBLIC_PATH_PREFIX = "/public";

interface EntityDashboardProps {}

const EntityDashboard = memo((_props: EntityDashboardProps) => {
  const location = useLocation();
  const { isPublic } = useWorkspace();

  const {
    type,
    branchId,
    projectId,
    workspaceId,
    path: entityId,
  } = useParams();

  const fallbackRedirectTo = useMemo(() => {
    const basePath = isPublic ? PUBLIC_PATH_PREFIX : "";
    return `${basePath}/project/${workspaceId}/${projectId}/${branchId}/radar`;
  }, [isPublic, workspaceId, projectId, branchId]);

  const fallbackComponent = useMemo(
    () => <Navigate to={fallbackRedirectTo} state={location.state} replace />,
    [fallbackRedirectTo, location.state]
  );

  const { category, config } = useMemo(() => {
    const category = type ? entityCategoryMap[type] : undefined;
    const config = category ? projectCategoryConfigs[category] : undefined;
    return { category, config };
  }, [type]);

  if (!config) return fallbackComponent;

  if (!entityId) {
    if (config.type === NavBarItemType.link && config.hasDashboard) {
      return (
        <CheckFeature
          feature={config.featureFlag}
          fallbackElement={fallbackComponent}
        >
          <EntityDashboardContent
            type={type}
            key={category}
            config={config}
            category={category}
          />
        </CheckFeature>
      );
    }
    return fallbackComponent;
  }

  return <EntityEditor fallbackComponent={fallbackComponent} />;
});

EntityDashboard.displayName = "EntityDashboard";

export default EntityDashboard;
