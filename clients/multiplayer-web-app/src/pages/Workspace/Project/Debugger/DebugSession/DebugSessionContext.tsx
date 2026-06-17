import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Replayer } from "rrweb";
import { useParams, Link } from "react-router-dom";
import { eventWithTime, metaEvent } from "@rrweb/types";
import { Button, Flex, Image, UseDisclosureReturn } from "@chakra-ui/react";

import {
  IDebugSession,
  IDebugSessionView,
  ObjectTypeEnum,
} from "@multiplayer/types";

import {
  addDebugSessionView,
  addDebugSessionStar,
  removeDebugSessionStar,
  removeDebugSessionView,
  renameDebugSessionView,
  generateNotebookFromDebugSession,
} from "shared/services/radar.service";
import useMessage from "shared/hooks/useMessage";

import {
  ILogNode,
  ITraceNode,
  IConsoleNode,
  ITraceData,
  SessionTabIndex,
  IDebugSessionNode,
  DebugSessionNodeType,
  SessionTabToDebugNodeType,
  IDebugSessionFilters,
  DebugSessionNodesState,
} from "./types";

import { useTabs } from "shared/providers/TabsContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";

import { clone, getLastNumberFromName, parseDate } from "shared/utils";
import { useDebugSessionData } from "./useDebugSessionData";
import EmptyScreen from "shared/components/EmptyScreen";
import PageLoading from "shared/components/PageLoading";
import SessionsIcon from "assets/images/emptyStates/SystemCatalog-Sessions.png";

import {
  collectAllSessionNodes,
  filterNodesByIdSet,
  getCheckedAndIndeterminateIds,
} from "./utils";
import useDebugSessionDisclosureState from "./useDebugSessionDisclosureState";
import { useVsCode } from "vscode/VsCodeContext";

const debugSessionNodesState = {
  [DebugSessionNodeType.Event]: [],
  [DebugSessionNodeType.Console]: [],
  [DebugSessionNodeType.Trace]: [],
  [DebugSessionNodeType.Log]: [],
};

interface IDebugSessionContext {
  scrollTarget: React.MutableRefObject<string>;
  // Session Data
  session: IDebugSession | undefined;
  setSession: React.Dispatch<React.SetStateAction<IDebugSession | undefined>>;
  sessionLoading: boolean;
  sessionTime: { start: number; end: number; total: number };

  // Events and Metadata
  events: eventWithTime[];
  metadata: metaEvent | null;
  setMetadata: React.Dispatch<metaEvent>;
  eventsLoading: boolean;

  // Session Nodes and Data
  sessionNodes: DebugSessionNodesState;
  logsLoading: boolean;
  tracesLoading: boolean;
  selectedNode: IDebugSessionNode<ITraceNode | ILogNode> | null;
  setSelectedNode: React.Dispatch<IDebugSessionNode<any>>;
  selectedError: IDebugSessionNode<any>;
  setSelectedError: <T>(node: IDebugSessionNode<T>) => void;

  // Time and Navigation
  selectNodeById: (id: string, open?: boolean) => void;
  setCustomSeekTime: (time: number) => void;
  onSeekRef: React.MutableRefObject<((timeMs: number) => void) | null>;
  selectNodeByTimestamp: (time: number) => void;
  setPlayerRef: (player: Replayer | null) => void;

  // Views and Components
  currentView: IDebugSessionView;
  currentViewComponents: Set<string>;
  systemViews: IDebugSessionView[];
  customViews: IDebugSessionView[];
  onViewCreate: () => void;
  onViewDelete: (id: string) => Promise<void>;
  onViewUpdate: (id: string, v: IDebugSessionView) => Promise<void>;
  onViewChange: (v: IDebugSessionView) => void;

  // UI State and Display
  tabIndex: number;
  setTabIndex: (index: number) => void;

  // Filters and Search
  filters: IDebugSessionFilters;
  handleSetFilters: (filters: Partial<IDebugSessionFilters>) => void;

  // Node Management
  starredNodes: Set<string>;
  checkedNodes: Map<string, boolean>;
  toggleSessionNodeStar: (nodeId: string) => Promise<void>;
  updateCheckedNodes: <T>(e, node: IDebugSessionNode<T>) => void;
  updateCheckedNodesForRoots: <T>(
    nodes: IDebugSessionNode<T>[],
    checked: boolean
  ) => void;
  isNodeExpanded: (id: string) => boolean;
  toggleCollapsed: (id: string) => void;
  expandedNodes: Set<string>;
  expandAll: () => void;
  collapseAll: () => void;

  expandedNotes: Set<string>;
  toggleNoteExpanded: (id: string) => void;

  // Drawer States
  viewsDisclosure: UseDisclosureReturn;
  notesDrawerDisclosure: UseDisclosureReturn;
  nodeDetailsDrawerDisclosure: UseDisclosureReturn;

  // Actions
  generateNotebookFromSession: () => Promise<void>;
  isPreviewMode: boolean;
}

const DebugSessionContext = createContext<IDebugSessionContext | null>(null);
const allView = { _id: "__all", name: "All" };
const defaultFilters: IDebugSessionFilters = {
  type: [],
  level: [],
  status: [],
  component: [],
  search: "",
  starred: false,
  mostRelevant: false,
  showOnlyExceptions: false,
};

const DebugSessionProvider = ({
  children,
  sessionId,
  isPreviewMode,
}: {
  children: ReactNode;
  sessionId: string;
  isPreviewMode?: boolean;
}) => {
  const message = useMessage();
  const { closeTabById } = useTabs();
  const { sendMessage } = useVsCode();
  const scrollTarget = useRef<string>(null);
  const lastSelectedId = useRef<string>(null);
  const { workspaceId, projectId } = useParams();

  const {
    session,
    events,
    metadata,
    sessionNodes,
    logsLoading,
    eventsLoading,
    tracesLoading,
    sessionLoading,
    setSession,
    setMetadata,
    setPlayerRef: _setPlayerRef,
  } = useDebugSessionData(sessionId);

  const [selectedError, setSelectedError] = useState(null);

  // Tab and navigation states
  const [tabIndex, setTabIndex] = useState(SessionTabIndex.All);

  // Direct ref to the Replayer for imperative seeks — bypasses React state entirely
  const playerInstanceRef = useRef<Replayer | null>(null);
  const seekRafRef = useRef<number | null>(null);
  // Callback ref registered by ReplayController to sync UI on external seeks
  const onSeekRef = useRef<((timeMs: number) => void) | null>(null);

  // Node management states
  const [starredNodes, setStarredNodes] = useState<Set<string>>(new Set());
  const [checkedNodes, setCheckedNodes] = useState<Map<string, boolean>>(
    new Map()
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // View management states
  const [systemViews, setSystemViews] = useState<IDebugSessionView[]>([]);
  const [customViews, setCustomViews] = useState<IDebugSessionView[]>([]);
  const [currentView, setCurrentView] = useState<IDebugSessionView>(allView);
  const [selectedNode, setSelectedNode] = useState<IDebugSessionNode<any>>();

  // Filter states
  const [filters, setFilters] = useState<IDebugSessionFilters>(
    clone(defaultFilters)
  );

  // Disclosure states from external hook
  const {
    viewsDisclosure,
    notesDrawerDisclosure,
    nodeDetailsDrawerDisclosure,
  } = useDebugSessionDisclosureState();

  // Node utility functions
  const isNodeExpanded = useCallback(
    (id: string) => expandedNodes.has(id),
    [expandedNodes]
  );

  const toggleCollapsed = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const newState = new Set(prev);
      if (newState.has(id)) {
        newState.delete(id);
      } else {
        newState.add(id);
      }
      return newState;
    });
  }, []);

  const toggleNoteExpanded = useCallback((id: string) => {
    setExpandedNotes((prev) => {
      const newState = new Set(prev);
      if (newState.has(id)) {
        newState.delete(id);
      } else {
        newState.add(id);
      }
      return newState;
    });
  }, []);

  // Helper function to collect all node IDs recursively
  const getAllNodeIds = useCallback(
    (nodes: IDebugSessionNode<any>[]): string[] => {
      const ids: string[] = [];
      const collectIds = (nodeList: IDebugSessionNode<any>[]) => {
        nodeList.forEach((node) => {
          if (node.childSpans && node.childSpans.length > 0) {
            ids.push(node.id);
            collectIds(node.childSpans);
          }
        });
      };
      collectIds(nodes);
      return ids;
    },
    []
  );

  const expandAll = useCallback(() => {
    const allNodes = Object.values(sessionNodes).flat();
    const allNodeIds = getAllNodeIds(allNodes);
    setExpandedNodes(new Set(allNodeIds));
  }, [sessionNodes, getAllNodeIds]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Navigation utility functions
  const selectNodeByTimestamp = useCallback(
    (
      timestamp: number,
      type: DebugSessionNodeType = DebugSessionNodeType.Console
    ) => {
      const nodes = sessionNodes[type] as IDebugSessionNode<any>[];
      const errorNode = nodes.find((node) => node.timestamp === timestamp);
      if (errorNode) {
        setTabIndex(SessionTabIndex.All);
        setSelectedError(errorNode);
      }
    },
    [sessionNodes]
  );

  const selectNodeById = useCallback(
    (id: string, open: boolean = false) => {
      const parentIds: string[] = [];
      scrollTarget.current = id;
      const findNode = (
        nodes: IDebugSessionNode<ITraceNode | ILogNode | IConsoleNode>[]
      ): IDebugSessionNode<ITraceNode | ILogNode | IConsoleNode> | null => {
        for (const node of nodes) {
          if (node.id === id) {
            return node;
          }
          if (node.childSpans && node.childSpans.length > 0) {
            parentIds.push(node.id);
            const foundInChildren = findNode(node.childSpans);
            if (foundInChildren) {
              return foundInChildren;
            }
            parentIds.pop();
          }
        }
        return null;
      };
      const node = findNode(Object.values(sessionNodes).flat());
      if (node) {
        if (open) {
          setSelectedNode(node);
        }
        setExpandedNodes((prev) => {
          const newState = new Set(prev);
          parentIds.forEach((id) => newState.add(id));
          return newState;
        });
      }
    },
    [sessionNodes]
  );

  const setCustomSeekTime = useCallback((time: number) => {
    if (seekRafRef.current !== null) {
      cancelAnimationFrame(seekRafRef.current);
    }
    seekRafRef.current = requestAnimationFrame(() => {
      seekRafRef.current = null;
      const player = playerInstanceRef.current;
      if (!player) return;
      const t = Math.floor(Math.max(time ?? 0, 0));
      player.pause(t);
      onSeekRef.current?.(t);
    });
  }, []);

  // Wrap setPlayerRef to also keep our local ref in sync for imperative seeks
  const setPlayerRef = useCallback(
    (player: Replayer | null) => {
      playerInstanceRef.current = player;
      _setPlayerRef(player);
    },
    [_setPlayerRef]
  );

  // Effect hooks for state synchronization
  useEffect(() => {
    // Sync session data with local state
    if (session) {
      setCustomViews(session.views);
      setStarredNodes(new Set(session.starredItems));
    } else {
      setCustomViews([]);
      setStarredNodes(new Set());
    }
    setSystemViews([allView]);
  }, [session]);

  useEffect(() => {
    if (session && sessionId) {
      sendMessage({ type: "setPanelTitle", title: session.name });
    }
  }, [session, sessionId]);

  useEffect(() => {
    // Handle session ID changes
    if (sessionId) {
      setCurrentView(allView);
    } else {
      closeTabById("debugger");
    }
  }, [sessionId]);

  // Node management actions
  const toggleSessionNodeStar = async (nodeId) => {
    try {
      if (!starredNodes.has(nodeId)) {
        await addDebugSessionStar(workspaceId, projectId, sessionId, nodeId);
        setStarredNodes((prev) => {
          const newState = new Set(prev);
          newState.add(nodeId);
          return newState;
        });
      } else {
        await removeDebugSessionStar(workspaceId, projectId, sessionId, nodeId);
        setStarredNodes((prev) => {
          const newState = new Set(prev);
          newState.delete(nodeId);
          return newState;
        });
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  // View management actions
  const onViewCreate = async () => {
    const allNodes = [
      ...sessionNodes[DebugSessionNodeType.Event],
      ...sessionNodes[DebugSessionNodeType.Console],
      ...sessionNodes[DebugSessionNodeType.Trace],
      ...sessionNodes[DebugSessionNodeType.Log],
    ] as IDebugSessionNode<ITraceData>[];
    const components = getCheckedAndIndeterminateIds(allNodes, checkedNodes);
    try {
      if (!components.length) {
        throw new Error(
          "You need to select at least one component to create a new view."
        );
      }
      const body = { name: getLastNumberFromName(customViews), components };
      const view = await addDebugSessionView(
        workspaceId,
        projectId,
        sessionId,
        body
      );
      setCustomViews((prev) => [...prev, view]);
      setCheckedNodes(new Map());
      setCurrentView(view);
    } catch (error) {
      message.handleError(error);
    }
  };

  const onViewUpdate = async (
    id: string,
    payload: Partial<IDebugSessionView>
  ) => {
    try {
      const res = await renameDebugSessionView(
        workspaceId,
        projectId,
        sessionId,
        id,
        payload
      );
      setCustomViews((prev) => prev.map((v) => (v._id === id ? res : v)));
      if (currentView._id === id) {
        setCurrentView(res);
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  const onViewDelete = async (id) => {
    try {
      const res = await removeDebugSessionView(
        workspaceId,
        projectId,
        sessionId,
        id
      );
      setCustomViews(res.views);
      if (currentView._id === id) {
        setCurrentView(allView);
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  const onViewChange = (view: IDebugSessionView) => {
    setCurrentView(view);
  };

  // Node selection utility functions
  const updateStateRecursively = <T,>(
    node: IDebugSessionNode<T>,
    checked: boolean,
    state: Map<string, boolean>
  ) => {
    state.set(node.id, checked);
    node.childSpans?.forEach((child) =>
      updateStateRecursively(child, checked, state)
    );
  };

  const getRangeNodes = <T,>(
    nodes: IDebugSessionNode<T>[],
    startId: string,
    endId: string
  ): IDebugSessionNode<T>[] => {
    const startIndex = nodes.findIndex((n) => n.id === startId);
    const endIndex = nodes.findIndex((n) => n.id === endId);
    if (startIndex === -1 || endIndex === -1) return [];

    const [start, end] = [startIndex, endIndex].sort((a, b) => a - b);
    return nodes.slice(start, end + 1);
  };

  const updateCheckedNodes = <T,>(e, node: IDebugSessionNode<T>) => {
    const updatedState = new Map(checkedNodes);
    const isShiftKey = e?.nativeEvent?.shiftKey;

    const getNodesInRange = () => {
      const allNodes =
        tabIndex === SessionTabIndex.All
          ? collectAllSessionNodes(Object.values(sessionNodes).flat())
          : sessionNodes[SessionTabToDebugNodeType[tabIndex]];
      return getRangeNodes(allNodes as any, lastSelectedId.current, node.id);
    };

    if (isShiftKey && lastSelectedId.current !== null) {
      const rangeNodes = getNodesInRange();
      rangeNodes.forEach((n) =>
        updateStateRecursively(n, e.target.checked, updatedState)
      );
    } else {
      updateStateRecursively(node, e.target.checked, updatedState);
    }

    setCheckedNodes(updatedState);
    lastSelectedId.current = node.id;
  };

  const updateCheckedNodesForRoots = <T,>(
    nodes: IDebugSessionNode<T>[],
    checked: boolean
  ) => {
    const updatedState = new Map(checkedNodes);
    lastSelectedId.current = null;
    nodes.forEach((n) => updateStateRecursively(n, checked, updatedState));
    setCheckedNodes(updatedState);
  };
  // Filter and selection handlers
  const handleSetFilters = useCallback(
    (newParam: Partial<IDebugSessionFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...newParam,
      }));
    },
    []
  );

  // External actions
  const generateNotebookFromSession = async () => {
    try {
      if (!session) return;
      const data = await generateNotebookFromDebugSession(
        session.workspace,
        session.project,
        session._id
      );

      const notebook = data?.entity;

      if (notebook) {
        message.success(
          <Flex align="center">
            Notebook {notebook.key} was generated successfully.
            <Button
              as={Link}
              size="sm"
              variant="light"
              borderRadius="base"
              to={`/project/${notebook.workspace}/${notebook.project}/${notebook.projectBranch}/entity/notebook/${notebook.entityId}`}
            >
              Open
            </Button>
          </Flex>,
          8000
        );
      }
    } catch (err) {
      message.handleError(err);
    }
    //todo: open new entity in tab
  };

  // Computed values and memoized state
  const sessionTime = useMemo(() => {
    if (!session) return { start: 0, end: 0, total: 0 };
    const start = parseDate(session.startedAt);
    const end = parseDate(session.stoppedAt);
    return { start, end, total: Math.max(end - start, 0) };
  }, [session]);

  const currentViewComponents = useMemo(() => {
    if (!currentView.components) {
      return null;
    }
    return new Set(currentView.components);
  }, [currentView, customViews, systemViews]);

  const filteredSessionNodes = useMemo(() => {
    if (!currentViewComponents) return sessionNodes;
    return Object.keys(sessionNodes).reduce<DebugSessionNodesState>(
      (acc, key) => {
        acc[key] = filterNodesByIdSet(sessionNodes[key], currentViewComponents);
        return acc;
      },
      clone(debugSessionNodesState)
    );
  }, [sessionNodes, currentViewComponents]);

  return (
    <DebugSessionContext.Provider
      value={{
        // Session Data
        scrollTarget,
        session,
        setSession,
        sessionLoading,
        sessionTime,

        // Events and Metadata
        events,
        metadata,
        setMetadata,
        eventsLoading,

        // Session Nodes and Data
        sessionNodes: filteredSessionNodes,
        logsLoading,
        tracesLoading,
        selectedNode,
        setSelectedNode,
        selectedError,
        setSelectedError,

        // Time and Navigation
        setCustomSeekTime,
        onSeekRef,
        selectNodeById,
        selectNodeByTimestamp,
        setPlayerRef,

        // Views and Components
        currentView,
        currentViewComponents,
        systemViews,
        customViews,
        onViewCreate,
        onViewDelete,
        onViewUpdate,
        onViewChange,

        // UI State and Display
        tabIndex,
        setTabIndex,

        // Filters and Search
        filters,
        handleSetFilters,

        // Node Management
        starredNodes,
        checkedNodes,
        toggleSessionNodeStar,
        updateCheckedNodes,
        updateCheckedNodesForRoots,
        isNodeExpanded,
        toggleCollapsed,
        expandAll,
        collapseAll,
        expandedNodes,
        // Notes
        expandedNotes,
        toggleNoteExpanded,
        // Drawer States
        viewsDisclosure,
        notesDrawerDisclosure,
        nodeDetailsDrawerDisclosure,
        // Actions
        generateNotebookFromSession,
        isPreviewMode,
      }}
    >
      {sessionLoading ? (
        <PageLoading />
      ) : session ? (
        <ThreadsProvider
          objectId={sessionId}
          objectType={ObjectTypeEnum.DEBUG_SESSION}
        >
          {children}
        </ThreadsProvider>
      ) : (
        <EmptyScreen
          title="Session not found"
          description="This session has been cancelled or deleted"
          icon={<Image mb="2" w="180px" src={SessionsIcon} />}
        />
      )}
    </DebugSessionContext.Provider>
  );
};

export function useDebugSession() {
  const context = useContext(DebugSessionContext);
  if (context === null) {
    throw new Error("useDebugSession must be used within DebugSessionProvider");
  }
  return context;
}

export { DebugSessionProvider };
