import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";

import {
  AddToChatButton,
  buildSpanContext,
  getSessionUrl,
} from "shared/components/AgentChat";

import { collectAllSessionNodes, collectTopmostCheckedNodes } from "../utils";
import { useDebugSession } from "../DebugSessionContext";
import { SessionTabIndex, SessionTabToDebugNodeType } from "../types";

const BulkSpansAddButton = () => {
  const { workspaceId, projectId } = useParams();
  const {
    session,
    sessionTime,
    sessionNodes,
    tabIndex,
    checkedNodes,
    currentViewComponents,
    updateCheckedNodesForRoots,
  } = useDebugSession();
  const checkedRoots = useMemo(() => {
    if (tabIndex === SessionTabIndex.All) {
      return collectAllSessionNodes(Object.values(sessionNodes).flat());
    }

    const nodeType = SessionTabToDebugNodeType[tabIndex];
    return nodeType ? sessionNodes[nodeType] : [];
  }, [sessionNodes, tabIndex]);

  const selectedNodes = useMemo(
    () => collectTopmostCheckedNodes(checkedRoots, checkedNodes),
    [checkedNodes, checkedRoots]
  );

  const getSpanContext = useCallback(() => {
    if (!session?._id || selectedNodes.length < 2) return undefined;

    const context = buildSpanContext({
      debugSessionId: session._id,
      debugSessionName: session.name,
      debugSessionUrl: getSessionUrl(workspaceId, projectId, session._id),
      nodes: selectedNodes,
      sessionStartMs: sessionTime.start,
    });

    updateCheckedNodesForRoots(checkedRoots, false);

    return context;
  }, [
    checkedRoots,
    projectId,
    selectedNodes,
    session?._id,
    session?.name,
    sessionTime.start,
    updateCheckedNodesForRoots,
    workspaceId,
  ]);

  if (currentViewComponents || selectedNodes.length < 2) {
    return null;
  }

  return (
    <AddToChatButton
      context={getSpanContext}
      tooltip="Attach spans to chat context"
      size="xs"
    />
  );
};

export default BulkSpansAddButton;
