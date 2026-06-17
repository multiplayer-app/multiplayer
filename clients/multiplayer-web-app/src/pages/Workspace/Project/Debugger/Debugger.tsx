import { memo } from "react";
import { useParams } from "react-router-dom";
import { useOtelIntegrations } from "shared/providers/IntegrationsContext";
import PageLoading from "shared/components/PageLoading";
import {
  useDebugSessions,
  DebugSessionsProvider,
} from "shared/providers/DebugSessionsContext";

import DebugSession from "./DebugSession";
import DebugSessions from "./DebugSessions";
import DebuggerIntro from "./DebuggerIntro";

const Debugger = () => {
  return (
    <DebugSessionsProvider>
      <DebuggerRootContent />
    </DebugSessionsProvider>
  );
};

const DebuggerRootContent = memo(() => {
  const { integrations, isIntegrationsLoaded } = useOtelIntegrations();
  const { sessions, hasFilters, loading } = useDebugSessions();

  return !isIntegrationsLoaded ? (
    <PageLoading />
  ) : sessions.cursor.total > 0 || hasFilters || integrations ? (
    <DebuggerContent />
  ) : loading ? (
    <PageLoading />
  ) : (
    <DebuggerIntro />
  );
});

const DebuggerContent = memo(() => {
  const { path: sessionId } = useParams();

  if (sessionId) {
    return <DebugSession sessionId={sessionId} />;
  }
  return <DebugSessions />;
});

export default Debugger;
