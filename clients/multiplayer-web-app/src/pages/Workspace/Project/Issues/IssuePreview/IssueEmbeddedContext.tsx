import { createContext, useContext, type ReactNode } from "react";

/**
 * True when the issue UI is embedded (e.g. agent session side panel Issue tab),
 * not the full Issues route. Used to tone down header chrome (actions, etc.).
 */
const IssueEmbeddedContext = createContext(false);

export function IssueEmbeddedProvider({ children }: { children: ReactNode }) {
  return (
    <IssueEmbeddedContext.Provider value={true}>
      {children}
    </IssueEmbeddedContext.Provider>
  );
}

export function useIssueEmbedded() {
  return useContext(IssueEmbeddedContext);
}
