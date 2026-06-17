import { formatTime } from "pages/Workspace/Project/Debugger/DebugSession/utils";

import { SNAPSHOT_KIND } from "../kinds";

export const SNAPSHOT_ATTACHMENT_SUMMARY =
  "A screenshot of the session recording at the attached playback timestamp. The agent renders this frame for visual analysis.";

export interface DebugSessionSnapshotData {
  debugSessionId: string;
  debugSessionName?: string;
  debugSessionUrl?: string;
  /** rrweb playback offset in milliseconds (matches sketch timestamps). */
  timestampMs: number;
  /** Human-readable offset from recording start, e.g. "01:23". */
  relativeTime: string;
}

export const getSnapshotName = (timestampMs: number) =>
  `Snapshot [${formatTime(timestampMs)}]`;

export const buildSnapshotContext = ({
  debugSessionId,
  debugSessionName,
  debugSessionUrl,
  timestampMs,
}: {
  debugSessionId: string;
  debugSessionName?: string;
  debugSessionUrl?: string;
  timestampMs: number;
}) => {
  const relativeTime = formatTime(timestampMs);
  const name = getSnapshotName(timestampMs);

  return {
    kind: SNAPSHOT_KIND,
    name,
    title: name,
    summary: SNAPSHOT_ATTACHMENT_SUMMARY,
    url: debugSessionUrl,
    data: {
      debugSessionId,
      debugSessionName,
      debugSessionUrl,
      timestampMs: Math.floor(Math.max(timestampMs, 0)),
      relativeTime,
    } satisfies DebugSessionSnapshotData,
  };
};
