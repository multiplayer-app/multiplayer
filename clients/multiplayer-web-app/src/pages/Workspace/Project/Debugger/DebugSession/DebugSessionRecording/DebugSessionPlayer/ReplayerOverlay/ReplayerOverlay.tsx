import { Replayer } from "rrweb";

import Sketch from "./Sketch";
import {
  ReplayerOverlayTool,
  useReplayerOverlay,
} from "./ReplayerOverlayContext";
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
  RoleType,
} from "@multiplayer/types";
import { useMemo } from "react";
import { usePermissions } from "shared/providers/PermissionsContext";
import ElementInspector from "./ElementInspector";
import { useDebugSession } from "../../../DebugSessionContext";
import { useElementInspectorAvailable } from "shared/components/AgentChat";

interface ReplayerOverlayProps {
  replayer: Replayer;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ReplayerOverlay = ({ replayer, containerRef }: ReplayerOverlayProps) => {
  const { tool } = useReplayerOverlay();
  const { hasAccess } = usePermissions();
  const { isPreviewMode } = useDebugSession();
  const elementInspectorAvailable = useElementInspectorAvailable();
  const readonly = useMemo(
    () =>
      isPreviewMode ||
      !hasAccess(
        RoleProjectPermissionEntity.SESSION_NOTES,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
    [hasAccess, isPreviewMode]
  );

  return (
    <>
      <Sketch
        readonly={readonly}
        replayer={replayer}
        containerRef={containerRef}
        isActive={tool === ReplayerOverlayTool.Sketch}
      />
      {elementInspectorAvailable && (
        <ElementInspector
          iframe={replayer.iframe}
          isActive={tool === ReplayerOverlayTool.Inspector}
        />
      )}
    </>
  );
};

export default ReplayerOverlay;
