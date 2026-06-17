import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
  RoleType,
  EntityType,
} from "@multiplayer/types";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { MultiplayerStateProvider } from "shared/providers/MultiplayerStateContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useVersion } from "shared/providers/VersionContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import EntityEditors from "../EntityEditors";

const EntityEditor = ({
  fallbackComponent,
  isSystem,
}: {
  fallbackComponent: React.ReactNode;
  isSystem?: boolean;
}) => {
  const { isPublic } = useWorkspace();
  const { hasAccess } = usePermissions();
  const { currentBranchId, currentBranch, isCurrentBranchLocked } =
    useVersion();
  const { projectId, type, path: entityId } = useParams();

  const hasEntityUpdateAccess = useMemo(() => {
    return hasAccess(
      RoleProjectPermissionEntity.ENTITY,
      RoleAccessAction.UPDATE,
      RoleType.PROJECT
    );
  }, [hasAccess]);

  const isReadonly = useMemo(() => {
    if (isPublic) return true;
    switch (type) {
      case EntityType.API:
      case EntityType.FILE:
        return true;
      default:
        return !hasEntityUpdateAccess || isCurrentBranchLocked;
    }
  }, [
    type,
    isPublic,
    currentBranch.data,
    isCurrentBranchLocked,
    hasEntityUpdateAccess,
  ]);

  return (
    <MultiplayerStateProvider
      key={currentBranchId}
      entityId={entityId}
      maxConnections={5}
      projectId={projectId}
      branchId={currentBranchId}
      entityType={type as EntityType}
    >
      <EntityEditors
        entityId={entityId}
        readonly={isReadonly}
        isSystem={isSystem}
        entityType={type as EntityType}
        fallbackComponent={fallbackComponent}
      />
    </MultiplayerStateProvider>
  );
};

export default EntityEditor;
