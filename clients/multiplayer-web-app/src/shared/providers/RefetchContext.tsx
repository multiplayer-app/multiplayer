import { createContext, useContext, useRef } from "react";
import { RefetchTargetType } from "shared/models/enums";

const RefetchContext = createContext(null);

export const RefetchProvider = ({ children }) => {
  const refetchers = useRef(new Map());

  const onRegisterRefetchFn = (key: RefetchTargetType, fn) => {
    refetchers.current.set(key, fn);
    return () => {
      refetchers.current.delete(key);
    };
  };

  const onRefetch = (key: RefetchTargetType) => {
    const fn = refetchers.current.get(key);
    if (fn) {
      fn();
    }
  };

  const onRefetchAll = () => {
    refetchers.current.forEach((fn) => fn());
  };

  return (
    <RefetchContext.Provider
      value={{ onRegisterRefetchFn, onRefetch, onRefetchAll }}
    >
      {children}
    </RefetchContext.Provider>
  );
};

export const useRefetch = () => {
  const context = useContext(RefetchContext);
  if (!context) {
    throw new Error("useRefetch must be used within a RefetchProvider");
  }
  return context;
};
