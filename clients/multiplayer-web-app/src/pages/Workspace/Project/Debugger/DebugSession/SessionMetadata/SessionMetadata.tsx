import {
  RoleType,
  IDebugSession,
  RoleAccessAction,
  IDebugSessionNode,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import { extractKeyValue } from "@multiplayer/util-shared";
import { useMemo } from "react";
import useMessage from "shared/hooks/useMessage";
import { ProjectSourceType } from "shared/models/enums";
import { useProject } from "shared/providers/ProjectContext";
import { updateDebugSession } from "shared/services/radar.service";
import { usePermissions } from "shared/providers/PermissionsContext";
import DebugSessionAttributes from "shared/components/DebugSessionAttributes";

import { ITraceNode } from "../types";
import { useDebugSession } from "../DebugSessionContext";
interface SessionMetadataProps {
  readonly?: boolean;
}

const SessionMetadata = ({ readonly }: SessionMetadataProps) => {
  const message = useMessage();
  const { emitUpdate } = useProject();
  const { hasAccess } = usePermissions();
  const { session, metadata, sessionNodes, setSession } = useDebugSession();

  const access = useMemo(
    () => ({
      readComment: hasAccess(
        RoleProjectPermissionEntity.THREAD,
        RoleAccessAction.READ,
        RoleType.PROJECT
      ),
      updateDebugSession: hasAccess(
        RoleProjectPermissionEntity.DEBUG_SESSION,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
    }),
    [hasAccess]
  );

  const handleUpdateSession = async (payload: Partial<IDebugSession>) => {
    try {
      const res = await updateDebugSession(
        session.workspace,
        session.project,
        session._id,
        payload
      );
      setSession({ ...res, tags: res.tags || [] });
      emitUpdate(ProjectSourceType.DEBUGGER, session._id, res);
    } catch (error) {
      message.handleError(error);
    }
  };

  const onSessionNameChange = async (e) => {
    const newName = e.target.value.trim();
    if (!!newName && newName !== session.name) {
      handleUpdateSession({ name: newName });
    }
  };

  const onTagChange = async (tags: string[]) => {
    handleUpdateSession({
      tags: tags.map((t) => (typeof t === "string" ? extractKeyValue(t) : t)),
    });
  };

  const rootClient = useMemo(() => {
    const rootTrace = sessionNodes?.trace?.length
      ? (sessionNodes.trace[0] as IDebugSessionNode<ITraceNode>)
      : null;
    if (!rootTrace) {
      return null;
    }

    const { SpanAttributes, ServiceName } = rootTrace.meta || {};

    return {
      host: SpanAttributes && SpanAttributes["http.host"],
      serviceName: ServiceName,
      meta: rootTrace.meta,
    };
  }, [sessionNodes]);

  return (
    <DebugSessionAttributes
      session={session}
      metadata={metadata}
      rootClient={rootClient}
      readonly={readonly || !access.updateDebugSession}
      onTagChange={onTagChange}
      onSessionNameChange={onSessionNameChange}
    />
  );
};

export default SessionMetadata;
