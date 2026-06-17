import { createContext, useContext, useState } from "react";
import useEventListener from "shared/hooks/useEventListener";
import ConnectionAlert from "shared/components/ConnectionAlert";

interface IConnectionContext {
  isOnline: boolean;
}

export const ConnectionContext = createContext<IConnectionContext>(null);

export const ConnectionProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  // const { connected } = useSocket();

  const handleOnline = () => {
    setIsOnline(true);
  };

  const handleOffline = () => {
    setIsOnline(false);
  };

  useEventListener("online", handleOnline, window);
  useEventListener("offline", handleOffline, window);

  return (
    <ConnectionContext.Provider value={{ isOnline }}>
      <ConnectionAlert isOnline={isOnline} isSocketConnected={true} />
      {children}
    </ConnectionContext.Provider>
  );
};

export function useConnectionState() {
  const context = useContext(ConnectionContext);
  if (context === null) {
    throw new Error(
      "useConnectionState must be used within ConnectionProvider"
    );
  }
  return context;
}
