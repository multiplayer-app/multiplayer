import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { getAuthHeaders } from "shared/api";
import { config } from "../../config";

type RadarNamespace = "agents" | "debug-sessions" | "end-users";

interface UseRadarSocketOptions {
  workspaceId?: string;
  projectId?: string;
  namespace: RadarNamespace;
  enabled?: boolean;
}

interface UseRadarSocketReturn {
  socket: Socket | null;
}

export const useRadarSocket = ({
  workspaceId,
  projectId,
  namespace,
  enabled = true,
}: UseRadarSocketOptions): UseRadarSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !workspaceId || !projectId) {
      return;
    }

    const baseURL = config.REACT_APP_API_BASE_URL || "";
    const radarPrefix = config.REACT_APP_RADAR_PREFIX;

    const socketInstance = io(
      `${baseURL}/workspaces/${workspaceId}/projects/${projectId}/${namespace}`,
      {
        path: `${radarPrefix}/ws`,
        withCredentials: true,
        reconnectionAttempts: 2,
        transports: ["websocket"],
        auth: {
          ...getAuthHeaders(),
        },
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [workspaceId, projectId, namespace, enabled]);

  return { socket };
};
