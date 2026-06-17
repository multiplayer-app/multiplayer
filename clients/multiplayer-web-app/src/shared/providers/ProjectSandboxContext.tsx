import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useParams } from "react-router-dom";
import { useWorkspace } from "./WorkspaceContext";
import { useDisclosure } from "@chakra-ui/react";
import PublicSandbox from "shared/components/PublicSandbox";
import { usePermissions } from "./PermissionsContext";
import { config } from "../../config";

interface IProjectSandboxContext {
  isSandbox: boolean;
  withSandboxCheck: (
    action: (...args: any[]) => void
  ) => (...args: any[]) => void;
}

const ProjectSandboxContext = createContext<IProjectSandboxContext | null>(
  null
);

const ProjectSandboxProvider = ({ children }: { children: ReactNode }) => {
  const { isPublic, hasWorkspaceAccess } = useWorkspace();
  const { isSandboxRef } = usePermissions();
  const { workspaceId, projectId } = useParams();
  const publicSandboxDisclosure = useDisclosure();

  const isSandbox = useMemo(() => {
    return (
      isPublic &&
      (config.REACT_APP_DEMO_PUBLIC || "").includes(workspaceId) &&
      (config.REACT_APP_DEMO_PUBLIC || "").includes(projectId)
    );
  }, [isPublic, workspaceId, projectId]);

  useEffect(() => {
    isSandboxRef.current = isSandbox;
    if (isSandbox) {
      const el = document.querySelector(".mp-session-debugger-popover-body p");
      if (el) {
        document.querySelector(
          ".mp-session-debugger-popover-body p"
        ).innerHTML =
          "Record a full-stack session recording to show us exactly what happened. This helps us improve the sandbox, while giving you a glimpse of how real users report issues with our widget – win-win!";
      }
    }
  }, [isSandbox]);

  const withSandboxCheck = useCallback(
    (action: (...args: any[]) => void) => {
      if (hasWorkspaceAccess) {
        return (...args: any[]) => {
          return action(...args);
        };
      }
      if (isSandbox) {
        return (e) => {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          publicSandboxDisclosure.onOpen();
        };
      }
      return () => {};
    },
    [isSandbox, hasWorkspaceAccess, publicSandboxDisclosure]
  );

  return (
    <ProjectSandboxContext.Provider value={{ isSandbox, withSandboxCheck }}>
      {children}
      <PublicSandbox disclosure={publicSandboxDisclosure} />
    </ProjectSandboxContext.Provider>
  );
};

export function useProjectSandbox() {
  const context = useContext(ProjectSandboxContext);
  if (context === null) {
    throw new Error(
      "useProjectSandbox must be used within ProjectSandboxProvider"
    );
  }
  return context;
}

export { ProjectSandboxProvider };
