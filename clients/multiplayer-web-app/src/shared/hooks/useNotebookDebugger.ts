import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NotebookDebugger,
  NotebookDebuggerEvents,
} from "../../integrations/NotebookDebugger";

import { useParams } from "react-router-dom";
import { useAuth } from "shared/providers/AuthContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useEntities } from "../providers/EntitiesContext";
import { RoleAccessAction, RoleProjectPermissionEntity, RoleType } from "@multiplayer/types";

export interface UseNotebookDebuggerReturn {
  running: boolean;
  instance: NotebookDebugger | null;
  stopSession: () => Promise<void>;
  startSession: () => Promise<void>;
}

const useNotebookDebugger = (): UseNotebookDebuggerReturn => {
  const { user } = useAuth();
  const { findEntityInCache } = useEntities();
  const { hasAccess } = usePermissions();
  const { workspaceId, projectId, path: entityId } = useParams();
  const [running, setRunning] = useState(false);

  const instance = useMemo<NotebookDebugger>(() => {
    if (!hasAccess(RoleProjectPermissionEntity.DEBUG_SESSION, RoleAccessAction.CREATE, RoleType.PROJECT,)) {
      return null;
    }

    const userName = user
      ? user.firstName && user.lastName
        ? user.firstName + " " + user.lastName
        : user.primaryEmail
      : "";

    const entityName = findEntityInCache(entityId)?.key || entityId;
    return new NotebookDebugger({
      entityId,
      projectId,
      workspaceId,
      userName,
      userId: user?.primaryEmail,
      resourceName: `Notebook ${entityName}`,
    });
  }, [entityId, user, projectId, workspaceId, hasAccess]);

  useEffect(() => {
    if (!instance) return;
    const checkSession = () => {
      setRunning(!!instance.getSession());
    };

    checkSession();
    instance.on(NotebookDebuggerEvents.STOP, checkSession);
    instance.on(NotebookDebuggerEvents.START, checkSession);

    return () => {
      instance.off(NotebookDebuggerEvents.STOP, checkSession);
      instance.off(NotebookDebuggerEvents.START, checkSession);
      instance.destroy();
    };
  }, [instance]);

  const startSession = useCallback(() => {
    if (!instance) return;
    return instance.startSession();
  }, []);

  const stopSession = useCallback(() => {
    if (!instance) return;
    return instance.stopSession();
  }, []);

  return { running, instance, startSession, stopSession };
};

export default useNotebookDebugger;
