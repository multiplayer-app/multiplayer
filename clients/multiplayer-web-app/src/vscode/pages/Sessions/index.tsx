import { useMemo } from "react";

import DebugSession from "pages/Workspace/Project/Debugger/DebugSession";
import DebugSessions from "pages/Workspace/Project/Debugger/DebugSessions";
import { DebugSessionsProvider } from "shared/providers/DebugSessionsContext";

const SessionsPage = ({ sessionId }: { sessionId: string }) => {
  const content = useMemo(() => {
    if (sessionId) {
      return <DebugSession sessionId={sessionId} />;
    }
    return <DebugSessions />;
  }, [sessionId]);

  return <DebugSessionsProvider>{content}</DebugSessionsProvider>;
};

export default SessionsPage;
