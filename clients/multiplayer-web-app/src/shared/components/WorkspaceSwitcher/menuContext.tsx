import { createContext, RefObject, useContext, type ReactNode } from "react";
import { IUserSession, IUserSessionWorkspace, IRole } from "@multiplayer/types";

export type SessionProject = IUserSessionWorkspace["projects"][number];

export type SwitcherMenuContextValue = {
  currentUserId: string;
  workspaceId: string | undefined;
  projectId: string | undefined;
  workspaceRoles: Record<string, IRole> | null;
  canAddProjectForWorkspace: (
    session: IUserSession,
    workspace: IUserSessionWorkspace
  ) => boolean;
  activeMenuItemRef: RefObject<HTMLButtonElement | null>;
  switchWorkspace: (
    session: IUserSession,
    workspace?: IUserSessionWorkspace
  ) => void | Promise<void>;
  switchToProject: (
    session: IUserSession,
    workspace: IUserSessionWorkspace,
    project: SessionProject
  ) => void;
  openCreateProjectModal: (
    session: IUserSession,
    workspace: IUserSessionWorkspace
  ) => void;
};

const SwitcherMenuContext = createContext<SwitcherMenuContextValue | null>(
  null
);

export function SwitcherMenuProvider({
  value,
  children,
}: {
  value: SwitcherMenuContextValue;
  children: ReactNode;
}) {
  return (
    <SwitcherMenuContext.Provider value={value}>
      {children}
    </SwitcherMenuContext.Provider>
  );
}

export function useSwitcherMenu(): SwitcherMenuContextValue {
  const ctx = useContext(SwitcherMenuContext);
  if (!ctx) {
    throw new Error("useSwitcherMenu must be used within SwitcherMenuProvider");
  }
  return ctx;
}
