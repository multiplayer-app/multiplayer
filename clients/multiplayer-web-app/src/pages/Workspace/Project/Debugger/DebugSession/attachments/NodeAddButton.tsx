import { useCallback } from "react";
import { Box } from "@chakra-ui/react";
import { useParams } from "react-router-dom";

import {
  AddToChatButton,
  buildSpanContext,
  getSessionUrl,
} from "shared/components/AgentChat";

import { useDebugSession } from "../DebugSessionContext";
import { IDebugSessionNode } from "../types";

interface NodeAddButtonProps {
  node: IDebugSessionNode<any>;
}

const NodeAddButton = ({ node }: NodeAddButtonProps) => {
  const { workspaceId, projectId } = useParams();
  const { session, sessionTime } = useDebugSession();
  const getSpanContext = useCallback(() => {
    if (!session?._id) return undefined;

    return buildSpanContext({
      debugSessionId: session._id,
      debugSessionName: session.name,
      debugSessionUrl: getSessionUrl(workspaceId, projectId, session._id),
      node,
      sessionStartMs: sessionTime.start,
    });
  }, [
    node,
    projectId,
    session?._id,
    session?.name,
    sessionTime.start,
    workspaceId,
  ]);

  return (
    <Box
      flexShrink={0}
      maxW="0"
      ml="auto"
      opacity={0}
      overflow="hidden"
      transition="max-width 0.2s cubic-bezier(.87, 0, .13, 1), opacity 0.2s cubic-bezier(.87, 0, .13, 1)"
      _groupHover={{ maxW: "8.75rem", opacity: 1 }}
    >
      <AddToChatButton
        context={getSpanContext}
        tooltip="Attach span to chat context"
        size="xs"
      />
    </Box>
  );
};

export default NodeAddButton;
