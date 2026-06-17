import { DebugSessionNoteState, ProviderConfig, SocketNamespace } from 'shared/models/interfaces';
import { useYjsProviderState } from './useYjsProviderState';
import { SessionNotesSocketIOProvider } from '../../integrations/SessionNotesSocketIOProvider';
import { useMemo } from 'react';



export function useSessionNoteState(
  workspaceId: string,
  projectId: string,
  sessionId: string,
  configs?: ProviderConfig
): DebugSessionNoteState {
  const params = useMemo(() => ({ workspaceId, projectId, sessionId }), [workspaceId, projectId, sessionId]);
  const state = useYjsProviderState<SessionNotesSocketIOProvider>(params, SocketNamespace.SESSION_NOTES, configs, 1)
  return { ...state, refreshConnections: null };
}
