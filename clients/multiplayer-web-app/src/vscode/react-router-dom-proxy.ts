// Complete proxy module for react-router-dom
// This provides mock implementations of all routing hooks for VS Code extension

import React from 'react';
import { useVsCode } from './VsCodeContext';

type VsCodeCurrentPage = "session" | "issue";

const getVsCodeRouteState = () => {
  const workspaceId = (window as any).workspaceId || "";
  const projectId = (window as any).projectId || "";
  const branchId = (window as any).branchId || "default";

  const sessionId = (window as any).sessionId || "";
  const issueId = (window as any).issueId || "";

  const currentPage: VsCodeCurrentPage =
    (window as any).currentPage ||
    (issueId ? "issue" : "session");

  const sourceType = currentPage === "issue" ? "issues" : "debugger";
  const type =
    currentPage === "issue"
      ? issueId
        ? "issue"
        : undefined
      : sessionId
        ? "session"
        : undefined;
  const path = currentPage === "issue" ? issueId || undefined : sessionId || undefined;

  return {
    workspaceId,
    projectId,
    branchId,
    currentPage,
    sessionId,
    issueId,
    sourceType,
    type,
    path,
  };
};

// Mock location object for VS Code extension
const createMockLocation = () => {
  const { workspaceId, projectId, branchId, sourceType, type, path } =
    getVsCodeRouteState();

  const basePath = `/project/${workspaceId}/${projectId}/${branchId}`;
  const pathname = `${basePath}${sourceType ? `/${sourceType}` : ""}${type ? `/${type}` : ""}${path ? `/${path}` : ""}`;

  return {
    pathname,
    search: queryStringSnapshot ? `?${queryStringSnapshot}` : "",
    hash: window.location.hash,
    state: null,
    key: "vscode-extension",
  };
};

// Mock hook implementations
const useLocation = () => {
  return createMockLocation();
};

const useParams = () => {
  const { state } = useVsCode();
  const isSession = state.currentPage === "session";
  return {
    workspaceId: state.workspaceId,
    projectId: state.projectId,
    branchId: "default",
    sourceType: isSession ? "debugger" : "issues",
    type: isSession ? "session" : "issue",
    path: isSession ? state.sessionId : state.issueId,
  };
};

const useNavigate = () => {
  return (to: string, options?: any) => {
    const vscode = (window as any).acquireVsCodeApi();
    if (vscode) {
      vscode.postMessage({
        type: "navigate",
        to,
        options,
      });
    }
  };
};

// VS Code webview document URL is vscode-webview://… but asset origins can be
// file+.vscode-resource / vscode-cdn. history.replaceState/replace with "?"
// can resolve to a different origin and throw SecurityError. Keep query state
// in memory and match react-router-dom setSearchParams (incl. updater fn).
const getInitialQueryString = (): string =>
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).toString()
    : "";

let queryStringSnapshot = getInitialQueryString();
const searchParamListeners = new Set<() => void>();

function subscribeSearchParams(onStoreChange: () => void) {
  searchParamListeners.add(onStoreChange);
  return () => searchParamListeners.delete(onStoreChange);
}

function getSearchParamsSnapshot() {
  return queryStringSnapshot;
}

function notifySearchParamListeners() {
  searchParamListeners.forEach((l) => l());
}

function toNextUrlSearchParams(
  nextInit:
    | URLSearchParams
    | Record<string, string | undefined>
    | string
    | ((prev: URLSearchParams) => URLSearchParams)
): URLSearchParams {
  const prev = new URLSearchParams(queryStringSnapshot);
  if (typeof nextInit === "function") {
    return new URLSearchParams(nextInit(prev).toString());
  }
  if (typeof nextInit === "string") {
    const s = nextInit.startsWith("?") ? nextInit.slice(1) : nextInit;
    return new URLSearchParams(s);
  }
  if (nextInit instanceof URLSearchParams) {
    return new URLSearchParams(nextInit.toString());
  }
  const next = new URLSearchParams();
  Object.entries(nextInit).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      next.set(key, String(value));
    }
  });
  return next;
}

function setSearchParamsStore(
  nextInit:
    | URLSearchParams
    | Record<string, string | undefined>
    | string
    | ((prev: URLSearchParams) => URLSearchParams),
  _opts?: { replace?: boolean }
) {
  const nextStr = toNextUrlSearchParams(nextInit).toString();
  if (nextStr !== queryStringSnapshot) {
    queryStringSnapshot = nextStr;
    notifySearchParamListeners();
  }
}

const useSearchParams = () => {
  const searchString = React.useSyncExternalStore(
    subscribeSearchParams,
    getSearchParamsSnapshot,
    getSearchParamsSnapshot
  );
  const searchParams = React.useMemo(
    () => new URLSearchParams(searchString),
    [searchString]
  );
  const setSearchParams = React.useCallback(
    (
      nextInit:
        | URLSearchParams
        | Record<string, string | undefined>
        | string
        | ((prev: URLSearchParams) => URLSearchParams),
      opts?: { replace?: boolean }
    ) => {
      setSearchParamsStore(nextInit, opts);
    },
    []
  );

  return [searchParams, setSearchParams] as const;
};

// Mock component implementations
const BrowserRouter = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

const Router = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

const Routes = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

const Route = ({ element, path }: { element: React.ReactNode; path?: string }) => {
  return React.createElement(React.Fragment, null, element);
};

const Navigate = ({ to }: { to: string }) => {
  return null;
};

const Link = ({ to, children, ...props }: { to: string; children: React.ReactNode;[key: string]: any }) => {
  return React.createElement('a', { href: to, ...props }, children);
};

const useOutlet = () => {
  return null;
};

const useOutletContext = () => {
  return {};
};

const useResolvedPath = (to: string) => {
  return { pathname: to, search: "", hash: "" };
};

const useMatch = (pattern: string) => {
  return null;
};

export {
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
  BrowserRouter,
  Router,
  Routes,
  Route,
  Navigate,
  Link,
  useOutlet,
  useOutletContext,
  useResolvedPath,
  useMatch,
};

export default {
  useLocation,
  useParams,
  useNavigate,
  useSearchParams,
  BrowserRouter,
  Router,
  Routes,
  Route,
  Navigate,
  Link,
  useOutlet,
  useOutletContext,
  useResolvedPath,
  useMatch,
};
