import { createContext, useContext } from "react";
import { IDiagramBoardActions, IDiagramBoardState } from "../models/interfaces";
import { ChangesViewMode } from "../models/enums";

export const DiagramStateProvider = ({ state, actions, children }) => {
  return (
    <DiagramStateContext.Provider value={state}>
      <DiagramActionsContext.Provider value={actions}>
        {children}
      </DiagramActionsContext.Provider>
    </DiagramStateContext.Provider>
  );
};

export const DiagramStateContext = createContext<
  | (IDiagramBoardState & {
      componentsInPlatform: { id: string; linkedTo: string }[];
      changesViewMode?: ChangesViewMode;
    })
  | null
>(null);

export function useDiagramState() {
  const context = useContext(DiagramStateContext);
  if (context === null) {
    throw new Error("useDiagramState must be used within DiagramStateProvider");
  }
  return context;
}

export const DiagramActionsContext = createContext<IDiagramBoardActions | null>(
  null
);

export function useDiagramActions() {
  const context = useContext(DiagramActionsContext);
  if (context === null) {
    throw new Error(
      "useDiagramActions must be used within DiagramActionsProvider"
    );
  }
  return context;
}
