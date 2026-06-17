import { SESSION_KIND } from "../kinds";
import { getSessionUrl } from "./url";

export const buildSessionContext = ({
  sessionId,
  name,
  workspaceId,
  projectId,
}: {
  sessionId: string;
  name?: string;
  workspaceId?: string;
  projectId?: string;
}) => {
  const normalizedName = name?.trim() || "Untitled debug session";
  const url = getSessionUrl(workspaceId, projectId, sessionId);

  return {
    kind: SESSION_KIND,
    name: normalizedName,
    title: normalizedName,
    summary: "Attached from project debug sessions",
    url,
    data: {
      debugSessionId: sessionId,
      name: normalizedName,
      url,
    },
  };
};
