import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useRadarSocket } from "./useRadarSocket";

const AGENT_TERMINAL_SUBSCRIBE = "agent:terminal:subscribe";
const AGENT_TERMINAL_UNSUBSCRIBE = "agent:terminal:unsubscribe";
const AGENT_TERMINAL_OUTPUT = "agent:terminal:output";
const AGENT_TERMINAL_INPUT = "agent:terminal:input";

export interface UseAgentTerminalOptions {
  onOutput?: (data: string) => void;
}

export interface UseAgentTerminalReturn {
  output: string;
  connected: boolean;
  error: string | null;
  sendInput: (data: string) => void;
}

export const useAgentTerminal = (
  agentId: string | undefined,
  enabled: boolean,
  options?: UseAgentTerminalOptions
): UseAgentTerminalReturn => {
  const { workspaceId, projectId } = useParams();
  const { socket } = useRadarSocket({
    workspaceId,
    projectId,
    namespace: "agents",
    enabled: Boolean(agentId && enabled),
  });
  const [output, setOutput] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(() => {
    if (!socket || !workspaceId || !projectId || !agentId || !enabled) {
      return;
    }
    socket.emit(AGENT_TERMINAL_SUBSCRIBE, {
      workspaceId,
      projectId,
      agentId,
    });
  }, [socket, workspaceId, projectId, agentId, enabled]);

  const unsubscribe = useCallback(() => {
    if (!socket || !workspaceId || !projectId || !agentId) {
      return;
    }
    socket.emit(AGENT_TERMINAL_UNSUBSCRIBE, {
      workspaceId,
      projectId,
      agentId,
    });
  }, [socket, workspaceId, projectId, agentId]);

  const sendInput = useCallback(
    (data: string) => {
      if (!socket || !workspaceId || !projectId || !agentId) return;
      socket.emit(AGENT_TERMINAL_INPUT, {
        workspaceId,
        projectId,
        agentId,
        data,
      });
    },
    [socket, workspaceId, projectId, agentId]
  );

  useEffect(() => {
    if (!socket || !agentId || !workspaceId || !projectId || !enabled) {
      return;
    }

    const onOutput = ({ data }: { data: string }) => {
      if (options?.onOutput) {
        options.onOutput(data);
      } else {
        setOutput((prev) => prev + data);
      }
    };

    socket.on("connect", () => {
      setError(null);
    });

    socket.on("ready", ({ ready }: { ready: boolean }) => {
      if (ready) {
        setConnected(true);
        setError(null);
        subscribe();
      } else {
        setConnected(false);
        setError("Authentication failed");
      }
    });

    socket.on("disconnect", (reason: string) => {
      setConnected(false);
      setError(`Disconnected: ${reason}`);
    });

    socket.on("connect_error", (err: Error) => {
      setError(err.message);
      setConnected(false);
    });

    socket.on("reconnect", () => {
      setConnected(true);
      setError(null);
      subscribe();
    });

    socket.on(AGENT_TERMINAL_OUTPUT, onOutput);

    return () => {
      socket.off(AGENT_TERMINAL_OUTPUT, onOutput);
      unsubscribe();
    };
  }, [
    socket,
    agentId,
    workspaceId,
    projectId,
    enabled,
    options?.onOutput,
    subscribe,
    unsubscribe,
  ]);

  return {
    output,
    connected,
    error,
    sendInput,
  };
};
