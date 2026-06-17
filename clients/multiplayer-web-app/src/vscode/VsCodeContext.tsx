import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  IDebugSession,
  SessionNoteType,
  ISessionNoteItem,
  IIssue,
} from "@multiplayer/types";
import type { DebugSessionNodesState } from "pages/Workspace/Project/Debugger/DebugSession/types";

export const IS_VSCODE = Boolean(
  typeof window !== "undefined" && window.acquireVsCodeApi
);
interface VSCodeWebviewAPI {
  getState: () => any;
  setState: (state: any) => void;
  postMessage: (message: any) => void;
}

interface FixSessionContext {
  session: IDebugSession;
  notes?: Record<SessionNoteType, ISessionNoteItem[]>;
  sessionNodes?: DebugSessionNodesState;
  checkedNodes?: Map<string, boolean>;
  element?: any;
}
interface FixIssueContext {
  issue: IIssue;
}
declare global {
  interface Window {
    acquireVsCodeApi: () => VSCodeWebviewAPI;
    vscode?: VSCodeWebviewAPI;
    workspaceId?: string;
    projectId?: string;
    issueId?: string;
    sessionId?: string;
    accessToken?: string;
    currentPage?: "session" | "issue";
  }
}

export const useVsCodeInstance = () => {
  const vscode = useRef<VSCodeWebviewAPI | null>(null);
  if (!vscode.current) {
    vscode.current = IS_VSCODE && window.acquireVsCodeApi();
  }
  return vscode.current;
};

export const useVsCodeActions = () => {
  const vscode = useVsCodeInstance();

  const sendMessage = useCallback(
    (message: any) => {
      if (!vscode || typeof vscode.postMessage !== "function") return;
      vscode.postMessage(message);
    },
    [vscode]
  );

  const fixSession = useCallback(
    (sessionId: string, context: FixSessionContext, assistantId?: string) => {
      sendMessage({ type: "fixSession", sessionId, context, assistantId });
    },
    [sendMessage]
  );

  const fixIssue = useCallback(
    (issueId: string, context: FixIssueContext, assistantId?: string) => {
      sendMessage({ type: "fixIssue", issueId, context, assistantId });
    },
    [sendMessage]
  );

  return { fixSession, fixIssue, sendMessage };
};

export type VsCodeState = {
  workspaceId: string;
  projectId: string;
  sessionId: string;
  issueId: string;
  accessToken: string;
  currentPage: "session" | "issue";
};

interface VsCodeContextValue {
  state: VsCodeState;
  setState: React.Dispatch<React.SetStateAction<VsCodeState>>;
  sendMessage: (message: any) => void;
  fixSession: (
    sessionId: string,
    context: FixSessionContext,
    assistantId?: string
  ) => void;
  fixIssue: (
    issueId: string,
    context: FixIssueContext,
    assistantId?: string
  ) => void;
}

export const VsCodeContext = createContext<VsCodeContextValue | null>(null);

export const VsCodeProvider = ({ children }: { children: React.ReactNode }) => {
  const vscode = useVsCodeInstance();
  const { sendMessage, fixSession, fixIssue } = useVsCodeActions();

  const [state, setState] = useState<VsCodeState>({
    issueId: window.issueId || "",
    sessionId: window.sessionId || "",
    projectId: window.projectId || "",
    workspaceId: window.workspaceId || "",
    accessToken: window.accessToken || "",
    currentPage: window.currentPage || "session",
  });

  useEffect(() => {
    if (!vscode) return;
    const initialState = vscode.getState() || {};
    const w = window as any;

    let issueId = w.issueId || initialState.issueId || "";
    let sessionId = w.sessionId || initialState.sessionId || "";
    let projectId = w.projectId || initialState.projectId || "";
    let workspaceId = w.workspaceId || initialState.workspaceId || "";
    let accessToken = w.accessToken || initialState.accessToken || "";
    let currentPage = w.currentPage || initialState.currentPage || "session";

    setState({
      issueId,
      sessionId,
      projectId,
      workspaceId,
      accessToken,
      currentPage,
    });

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "updateActiveSession":
          sessionId = message.sessionId || "";
          if (sessionId) {
            const newState = {
              ...vscode.getState(),
              sessionId,
              currentPage: "session",
            };
            w.sessionId = sessionId;
            vscode.setState(newState);
            setState((prev) => ({
              ...prev,
              sessionId,
              currentPage: "session",
            }));
          }
          break;
        case "updateActiveIssue":
          issueId = message.issueId || "";
          if (issueId) {
            const newState = {
              ...vscode.getState(),
              issueId,
              currentPage: "issue",
            };
            w.issueId = issueId;
            vscode.setState(newState);
            setState((prev) => ({ ...prev, issueId, currentPage: "issue" }));
          }
          break;
        case "refresh":
          window.location.reload();
          break;
        case "getAccessTokenResponse":
          accessToken = message.accessToken || null;
          w.accessToken = accessToken;
          vscode.setState({ ...vscode.getState(), accessToken });
          setState((prev) => ({ ...prev, accessToken }));
          break;
        case "confirmDialogResponse":
          // Handle confirmation dialog response when deleting a session
          break;
      }
    };

    w.addEventListener("message", handleMessage);

    return () => {
      w.removeEventListener("message", handleMessage);
    };
  }, [vscode]);

  return (
    <VsCodeContext.Provider
      value={{ state, setState, sendMessage, fixSession, fixIssue }}
    >
      {children}
    </VsCodeContext.Provider>
  );
};

export const useVsCode = () => {
  const context = useContext(VsCodeContext);
  if (context === null) {
    throw new Error("useVsCode must be used within VsCodeProvider");
  }
  return context;
};
