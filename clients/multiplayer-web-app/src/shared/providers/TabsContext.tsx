import {
  IEntity,
  EntityType,
  IDebugSession,
  IFlowMetadata,
  IntegrationTypeEnum,
  IIssue,
  IEndUser,
  IAgentChat,
} from "@multiplayer/types";
import {
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
  ReactNode,
} from "react";
import { ProjectSourceType } from "shared/models/enums";
import { useNavigate, useParams } from "react-router-dom";
import {
  encodeFilePath,
  getNestedProperty,
  setNestedProperty,
} from "shared/utils";

import { useAuth } from "./AuthContext";
import { useVersion } from "./VersionContext";
import { useProject } from "./ProjectContext";

export interface ITab {
  _id: string;
  type?:
    | EntityType
    | IntegrationTypeEnum
    | ProjectSourceType
    | "session"
    | "issue"
    | "user"
    | "flow"
    | "agent";
  key: string;
  state?: object;
  isTemp?: boolean;

  sourceType: ProjectSourceType;
  originBranch?: string;
  branch?: string;
}

export enum NavigationMode {
  NONE = 0,
  TABS = 1,
  NEW_TAB = 2,
}
interface ITabContext {
  tabs: ITab[];
  currentTab: ITab;
  activeTabState: any;
  setActiveTabState: React.Dispatch<React.SetStateAction<any>>;
  setTabs: React.Dispatch<React.SetStateAction<ITab[]>>;
  onTabClose: (arg: ITab) => void;
  navigateToTab: (arg: ITab) => void;
  onAutoDocsOpen: () => void;
  onTabOpen: (arg: ITab, navigationMode?: NavigationMode) => void;
  onEntityOpen: (
    arg: IEntity,
    navigationMode?: NavigationMode,
    options?: { state?: any; isTemp?: boolean }
  ) => void;
  onFlowOpen: (arg: any, navigationMode?: NavigationMode) => void;
  onFileOpen: (arg: any, navigationMode?: NavigationMode) => void;
  onSessionOpen: (arg: IDebugSession, navigationMode?: NavigationMode) => void;
  onIssueOpen: (arg: IIssue, navigationMode?: NavigationMode) => void;
  onUserOpen: (arg: IEndUser, navigationMode?: NavigationMode) => void;
  onAgentSessionOpen: (
    arg: IAgentChat,
    navigationMode?: NavigationMode
  ) => void;
  focusTab: () => void;
  closeTabById: (id: string) => void;
  clearTabs: () => void;
}

const version = "0.1";
export const TabsContext = createContext<ITabContext | null>(null);

export const TabsProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { layoutState } = useProject();
  const { currentBranchId } = useVersion();
  const { workspaceId, projectId, branchId, sourceType, type, path } =
    useParams();
  const cacheKey = useMemo(
    () => `${userId}${projectId}${currentBranchId}__${version}`,
    [userId, projectId, currentBranchId]
  );

  const [tabs, setTabs] = useState<ITab[]>(
    getTabs(cacheKey, layoutState.showTabs)
  );

  const [activeTabState, setActiveTabState] = useState(
    getActiveTabState(cacheKey)
  );

  const baseTabOptions = useMemo(
    () => ({ originBranch: currentBranchId, isTemp: true }),
    [currentBranchId]
  );

  useEffect(() => {
    setActiveTabState(getActiveTabState(cacheKey));
  }, [cacheKey]);

  useEffect(() => {
    const cache = JSON.parse(localStorage.getItem("tabsStates")) || {};
    setNestedProperty(cache, [cacheKey], activeTabState);

    // Limit the total number of tab states to keep only the last 5
    const limitedCache = limitTabStates(cache);

    localStorage.setItem("tabsStates", JSON.stringify(limitedCache));
  }, [activeTabState, cacheKey]);

  useEffect(() => {
    if (!layoutState.showTabs) {
      localStorage.removeItem("tabs");
      return;
    }
    const cache = JSON.parse(localStorage.getItem("tabs")) || {};
    setNestedProperty(cache, [cacheKey], tabs);

    // Limit the total number of tab caches to keep only the last 5
    const limitedCache = limitTabStates(cache);

    localStorage.setItem("tabs", JSON.stringify(limitedCache));
  }, [tabs, cacheKey]);

  const navigateToTab = useCallback(
    (tab: ITab, mode: NavigationMode = NavigationMode.TABS) => {
      if (mode === NavigationMode.NONE) return;
      // console.log("navigateToTab");
      // if (!tab) {
      //   navigate("");
      //   return;
      // }
      const { sourceType, type, _id, state } = tab;
      const tabPath =
        type && _id ? `${sourceType}/${type}/${_id}` : `${sourceType}`;

      if (mode === NavigationMode.TABS) {
        navigate(tabPath, { replace: layoutState.showTabs, state });
      }

      if (mode === NavigationMode.NEW_TAB) {
        const basePath = `/project/${workspaceId}/${projectId}/${branchId}`;
        const fullUrl = `${window.location.origin}${basePath}/${tabPath}`;
        window.open(fullUrl, "_blank");
      }
    },
    [navigate, layoutState.showTabs, workspaceId, projectId, branchId]
  );

  const onTabOpen = useCallback(
    (tab: ITab, navigationMode: NavigationMode = NavigationMode.TABS) => {
      if (layoutState.showTabs) {
        setTabs((prev) => {
          const tabOptions = { ...baseTabOptions, ...tab };
          const exists = prev.some(
            (t) => t._id === tab._id || isSameTabInDifferentBranch(t, tab)
          );
          if (exists) {
            return prev;
          }
          const updatedTabs = prev.filter((t) => !t.isTemp);
          return [...updatedTabs, tabOptions];
        });
      }
      navigateToTab(tab, navigationMode);
    },
    [navigateToTab, layoutState.showTabs]
  );

  const isSameTabInDifferentBranch = (tab1: ITab, tab2: ITab) => {
    return (
      tab1.key === tab2.key &&
      tab1.type === tab2.type &&
      tab1.sourceType === tab2.sourceType &&
      tab1.branch !== tab2.branch
    );
  };

  const onTabClose = (tab: ITab) => {
    if (
      tab.type !== EntityType.EXCALIDRAW &&
      tab.type !== EntityType.PLATFORM
    ) {
      setActiveTabState((prev) => {
        if (!prev) return {};
        const { [tab._id]: current, ...rest } = prev;
        return rest;
      });
    }

    setTabs((prev) => prev.filter((t) => t !== tab));
  };

  const closeTabById = (tabId: string) => {
    const tabIndex = tabs.findIndex((t) => t._id === tabId);
    if (tabIndex >= 0) {
      closeTab(tabs[tabIndex], tabIndex);
    }
  };

  const closeTab = (tab: ITab, index: number) => {
    if (tab._id === path || !path) {
      const adjacentTab = tabs[index + 1] || tabs[index - 1];
      if (adjacentTab) {
        navigateToTab(adjacentTab);
      } else {
        navigate("");
      }
    }
    onTabClose(tab);
  };

  const onFlowOpen = (flow: IFlowMetadata, navigationMode?: NavigationMode) => {
    onTabOpen(
      {
        _id: flow.id,
        type: "flow",
        key: flow.name || "unknown",
        sourceType: ProjectSourceType.FLOWS,
      },
      navigationMode
    );
  };

  const onSessionOpen = (
    session: IDebugSession,
    navigationMode?: NavigationMode
  ) => {
    onTabOpen(
      {
        _id: session._id,
        type: "session",
        key: session.name || `Session: #${session._id}`, // session.name
        sourceType: ProjectSourceType.DEBUGGER,
      },
      navigationMode
    );
  };

  const onIssueOpen = (issue: IIssue, navigationMode?: NavigationMode) => {
    onTabOpen(
      {
        _id: issue.titleHash || issue._id,
        type: "issue",
        key: issue.title || `Issue: #${issue._id}`,
        sourceType: ProjectSourceType.ISSUES,
      },
      navigationMode
    );
  };

  const onUserOpen = (user: IEndUser, navigationMode?: NavigationMode) => {
    onTabOpen(
      {
        _id: user._id,
        type: "user",
        key: `${user.attributes.name}` || `User: #${user._id}`,
        sourceType: ProjectSourceType.END_USERS,
      },
      navigationMode
    );
  };

  const onAgentSessionOpen = (
    session: IAgentChat,
    navigationMode?: NavigationMode
  ) => {
    const id = session._id;
    onTabOpen(
      {
        _id: id,
        type: "session",
        key: session.title || `Session: #${id.slice(0, 8)}`,
        sourceType: ProjectSourceType.AGENTS,
        state: { session },
      },
      navigationMode
    );
  };

  const onAutoDocsOpen = () => {
    onTabOpen({
      _id: "radar",
      key: "System",
      isTemp: false,
      sourceType: ProjectSourceType.RADAR,
    });
  };

  const onEntityOpen = (
    entity: IEntity,
    navigationMode?: NavigationMode,
    options?: { state?: any; isTemp?: boolean }
  ) => {
    onTabOpen(
      {
        _id: entity.entityId,
        key: entity.key,
        type: entity.type,
        state: options?.state,
        isTemp: options?.isTemp,
        sourceType: ProjectSourceType.ENTITY,
      },
      navigationMode
    );
  };

  const onFileOpen = (
    file: {
      type: any;
      path: string;
      name: string;
      repoId: string;
      branch: string;
      repositoryName: string;
      repositoryOwner: string;
    },
    navigationMode?: NavigationMode
  ) => {
    const {
      name,
      path,
      repoId,
      branch,
      type,
      repositoryOwner,
      repositoryName,
    } = file;

    const encodedPath = encodeFilePath([repoId, branch, path]);

    onTabOpen(
      {
        type,
        branch,
        key: name,
        _id: encodedPath,
        state: { repositoryOwner, repositoryName },
        sourceType: ProjectSourceType.FILE,
      },
      navigationMode
    );
  };

  const currentTab = useMemo(
    () =>
      tabs.find(
        (t) =>
          t.sourceType === sourceType &&
          (!type || t.type === type) &&
          (!path || t._id === path)
      ),
    [tabs, sourceType, type, path]
  );

  const focusTab = () => {
    if (!currentTab?.isTemp || !layoutState.showTabs) return;
    setTabs((prev) =>
      prev.map((t) => (t === currentTab ? { ...t, isTemp: false } : t))
    );
  };

  const clearTabs = useCallback(() => {
    localStorage.removeItem("tabs");
    localStorage.removeItem("tabsStates");
    setTabs([]);
    setActiveTabState({});
  }, []);

  return (
    <TabsContext.Provider
      value={{
        tabs,
        currentTab,
        activeTabState,
        focusTab,
        clearTabs,
        closeTabById,
        navigateToTab,
        setActiveTabState,
        setTabs,
        onTabOpen,
        onAutoDocsOpen,
        onFileOpen,
        onTabClose,
        onEntityOpen,
        onSessionOpen,
        onFlowOpen,
        onIssueOpen,
        onUserOpen,
        onAgentSessionOpen,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
};

export function useActiveTabState<T>(
  initialState?: T
): [T, (payload: T | ((p: T) => T)) => void] {
  const { path, sourceType } = useParams();
  const tabId = path || sourceType;
  const context = useContext(TabsContext);

  if (context === null) {
    throw new Error("useActiveTabState must be used within TabsProvider");
  }

  const { activeTabState, setActiveTabState } = context;

  const tabState = useMemo<T>(() => {
    return getNestedProperty(activeTabState, [tabId]);
  }, [tabId, activeTabState]);

  const setTabState = useCallback(
    (payload: (arg0: any) => any): void => {
      setActiveTabState((prev = {}) => {
        const newState = {
          ...prev,
          [tabId]:
            typeof payload === "function"
              ? payload({ ...initialState, ...prev[tabId] })
              : payload,
        };

        // Apply limitation to keep only the last 5 tab states
        return limitTabStates(newState);
      });
    },
    [tabId]
  );

  useEffect(() => {
    if (initialState && !tabState) {
      setActiveTabState((prev) => {
        const newState = { ...prev, [tabId]: initialState };

        // Apply limitation to keep only the last 5 tab states
        return limitTabStates(newState);
      });
    }
  }, [initialState, tabState, tabId]);

  const state = useMemo((): T => {
    return {
      ...(initialState || {}),
      ...(tabState || {}),
    } as T;
  }, [initialState, tabState]);

  return [state, setTabState];
}

export function useTabs() {
  const context = useContext(TabsContext);
  if (context === null) {
    throw new Error("useTabs must be used within TabsProvider");
  }
  return context;
}

const getTabs = (cacheKey: string, showTabs: boolean): ITab[] => {
  if (!showTabs) return [];
  const cachedTabs = JSON.parse(localStorage.getItem("tabs")) || {};
  return cachedTabs[cacheKey] || [];
};

const getActiveTabState = (cacheKey: string): any => {
  const cache = JSON.parse(localStorage.getItem("tabsStates")) || {};
  return getNestedProperty(cache, [cacheKey]);
};

const limitTabStates = (cache: any, maxStates: number = 5): any => {
  const keys = Object.keys(cache);
  if (keys.length <= maxStates) {
    return cache;
  }

  // Keep only the last 5 tab states
  const limitedCache: any = {};
  keys.slice(-maxStates).forEach((key) => {
    limitedCache[key] = cache[key];
  });

  return limitedCache;
};
