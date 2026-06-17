import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export const SharedStateContext =
  createContext<[Record<string, any>, React.Dispatch<Record<string, any>>]>(
    null
  );

export const SharedStateProvider = ({ children }) => {
  const [state, setState] = useState<any>({});

  const setSharedState = useCallback((payload) => {
    setState((prev) => {
      if (typeof payload === "function") return { ...prev, ...payload(prev) };
      return { ...prev, ...payload };
    });
  }, []);

  return (
    <SharedStateContext.Provider value={[state, setSharedState]}>
      {children}
    </SharedStateContext.Provider>
  );
};

export function useSharedState() {
  const context = useContext(SharedStateContext);
  if (context === null) {
    throw new Error("useSharedState must be used within SharedStateProvider");
  }

  return context;
}
