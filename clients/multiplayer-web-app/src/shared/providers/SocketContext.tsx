import {
  useState,
  createContext,
  useContext,
  useRef,
  useCallback,
} from "react";
import io, { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { SocketError } from "@multiplayer/types";
import { getAuthHeaders } from "shared/api";
import { config } from "../../config";

const baseURL = config.REACT_APP_API_BASE_URL || "";
const collaborationPrefix = config.REACT_APP_COLLABORATION_PREFIX;

export interface ISocketContext {
  connected: boolean;
  reconnecting: boolean;
  error: SocketError | null;

  subscribe: (event: string, cb: (...args: any[]) => void) => void;
  unsubscribe: (event: string, cb: (...args: any[]) => void) => void;
  emitEvent: (event: string, ...args: any[]) => void;
  connect: (projectId: string) => Socket<DefaultEventsMap, DefaultEventsMap>;
  disconnect: () => void;
}

const SocketContext = createContext<ISocketContext | null>(null);

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(
    null
  );
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<SocketError | null>(null);
  const emitters = useRef<Record<string, any[]>>({});

  const connect = useCallback((projectId: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(`${baseURL}/project|${projectId}`, {
      path: `${collaborationPrefix}/ws`,
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 20000,
      auth: {
        ...getAuthHeaders(),
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setReconnecting(false);
      setError(null);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("reconnect_attempt", () => {
      setReconnecting(true);
    });

    socket.on("reconnect", () => {
      setConnected(true);
      setReconnecting(false);
      setError(null);

      // Re-emit previous events if needed
      Object.entries(emitters.current).forEach(([event, args]) => {
        socket.emit(event, ...args);
      });
    });

    socket.on("reconnect_error", (err: SocketError) => {
      setError(err);
      setReconnecting(false);
    });

    socket.on("connect_error", (err: SocketError) => {
      setError(err);
    });

    return socket;
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setReconnecting(false);
    setError(null);
    if (!socketRef.current) return;

    socketRef.current.removeAllListeners();
    socketRef.current.disconnect();
    socketRef.current = null;
  }, []);

  const subscribe = useCallback(
    (event: string, cb: (...args: any[]) => void) => {
      socketRef.current?.on(event, cb);
    },
    []
  );

  const unsubscribe = useCallback(
    (event: string, cb: (...args: any[]) => void) => {
      socketRef.current?.off(event, cb);
    },
    []
  );

  const emitEvent = useCallback((event: string, ...args: any[]) => {
    emitters.current[event] = args;
    socketRef.current?.emit(event, ...args);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        connected,
        reconnecting,
        error,
        connect,
        disconnect,
        subscribe,
        unsubscribe,
        emitEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

export { useSocket, SocketProvider };
