import { useCallback } from "react";
import { useParams } from "react-router-dom";

import {
  AddToChatButton,
  buildSnapshotContext,
  getSessionUrl,
} from "shared/components/AgentChat";

import { useDebugSession } from "../DebugSessionContext";
import { useReplayerOverlay } from "../DebugSessionRecording/DebugSessionPlayer/ReplayerOverlay/ReplayerOverlayContext";
import { normalizeTimestamp } from "../DebugSessionRecording/DebugSessionPlayer/utils/normalizeTimestamp";

const SnapshotAddButton = () => {
  const { workspaceId, projectId } = useParams();
  const { session } = useDebugSession();
  const { replayer } = useReplayerOverlay();
  const getSnapshotContext = useCallback(() => {
    if (!session?._id || !replayer) return undefined;

    return buildSnapshotContext({
      debugSessionId: session._id,
      debugSessionName: session.name,
      debugSessionUrl: getSessionUrl(workspaceId, projectId, session._id),
      timestampMs: normalizeTimestamp(replayer.getCurrentTime()),
    });
  }, [projectId, replayer, session?._id, session?.name, workspaceId]);

  return (
    <AddToChatButton
      context={getSnapshotContext}
      tooltip="Attach screenshot to chat context"
      size="xs"
    />
  );
};

export default SnapshotAddButton;
