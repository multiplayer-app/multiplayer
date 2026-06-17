import { IProject, IWorkspaceUser, PresenceEvents } from "@multiplayer/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NavigateFunction,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { getProject } from "shared/services/workspace.service";

import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { useEventEmitter } from "shared/hooks/useEventEmitter";
import PageLoading from "shared/components/PageLoading";
import ResourceUnavailable from "pages/Workspace/Redirects/ResourceUnavailable";
import {
  getProjectStateCache,
  setProjectStateCache,
  ProjectStorageState,
} from "shared/storage/projectStorage";
import { usePermissions } from "./PermissionsContext";

interface ProjectContext {
  projectId: string;
  project: IProject;
  layoutState: ProjectStorageState;
  users: Map<string, IWorkspaceUser>;
  projectContentContainerRef: React.RefObject<HTMLDivElement>;
  navigate: NavigateFunction;
  setLayoutState: React.Dispatch<React.SetStateAction<any>>;
  // Generic subscription system
  subscribeToUpdates: (
    type: string,
    id: string,
    callback: (data: any) => void
  ) => () => void;
  emitUpdate: (type: string, id: string, data: any) => void;
}

export const ProjectContext = createContext<ProjectContext | null>(null);

// TODO: move state to use reducer
export const ProjectProvider = ({ children }) => {
  const { userId } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const { setFeatureFlags } = usePermissions();
  const projectContentContainerRef = useRef<HTMLDivElement>(null);
  const { workspaceId, projectId } = useParams();
  const [fetching, setFetching] = useState(true);
  const [project, setProject] = useState<IProject>(null);
  const [users, setUsers] = useState<Map<string, IWorkspaceUser>>(new Map());

  const projectCacheKey = useMemo(() => {
    if (!userId || !projectId) {
      return "";
    }
    return `${userId}_${projectId}`;
  }, [userId, projectId]);

  const layoutCacheKey = useMemo(() => {
    if (!userId || !workspaceId) {
      return "";
    }
    return `${userId}_${workspaceId}`;
  }, [userId, workspaceId]);

  const [layoutState, setLayoutState] = useState<ProjectStorageState>(
    getProjectStateCache(layoutCacheKey)
  );
  const { subscribeToEvent, emitEvent } = useEventEmitter();

  const fetchData = useCallback(
    async (workspaceId: string, projectId: string) => {
      if (!workspaceId || !projectId) {
        setFetching(false);
        return;
      }

      setFetching(true);
      try {
        const projectRes = await getProject(workspaceId, projectId);
        socket.connect(projectId);
        setProject(projectRes);
        if (projectRes.featureFlags) {
          setFeatureFlags(projectRes.featureFlags);
        }
      } catch (error) {
        setProject(null);
      } finally {
        setFetching(false);
      }
    },
    [socket.connect, setFeatureFlags]
  );

  useEffect(() => {
    if (!projectCacheKey) {
      return;
    }
    setProjectStateCache(projectCacheKey, { activeUrl: location.pathname });
  }, [projectCacheKey, location.pathname]);

  useEffect(() => {
    fetchData(workspaceId, projectId);
    return () => {
      socket.disconnect();
    };
  }, [workspaceId, projectId, fetchData, socket.disconnect]);

  useEffect(() => {
    if (!layoutCacheKey) {
      return;
    }

    const workspaceLayoutState = getProjectStateCache(layoutCacheKey);
    if (!workspaceLayoutState.activeUrl && projectCacheKey) {
      // One-time migration path: seed workspace-scoped layout from older
      // project-scoped cache if workspace cache is missing.
      const projectLayoutState = getProjectStateCache(projectCacheKey);
      const { selectedEntityCategory: _sel, ...projectLayoutRest } =
        projectLayoutState;
      setLayoutState((prev) => ({
        ...projectLayoutRest,
        selectedEntityCategory: prev.selectedEntityCategory,
      }));
      setProjectStateCache(layoutCacheKey, projectLayoutState);
      return;
    }

    const { selectedEntityCategory: _sel, ...workspaceLayoutRest } =
      workspaceLayoutState;
    setLayoutState((prev) => ({
      ...workspaceLayoutRest,
      selectedEntityCategory: prev.selectedEntityCategory,
    }));
  }, [layoutCacheKey, projectCacheKey]);

  useEffect(() => {
    if (layoutCacheKey && layoutState) {
      setProjectStateCache(layoutCacheKey, layoutState);
    }
  }, [layoutState, layoutCacheKey]);

  useEffect(() => {
    const onInitState = (data) => {
      setUsers(new Map(Object.entries(data.users)));
    };

    const onJoin = (data: IWorkspaceUser) => {
      setUsers((prev) => {
        const newMap = new Map(prev);
        newMap.set(data._id, data);
        return newMap;
      });
    };

    const onLeave = (id) => {
      setUsers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    };

    if (socket.connected) {
      socket.subscribe(PresenceEvents.INIT_STATE, onInitState);
      socket.subscribe(PresenceEvents.USER_LEFT_PROJECT, onLeave);
      socket.subscribe(PresenceEvents.USER_JOINED_PROJECT, onJoin);
    }

    return () => {
      socket.unsubscribe(PresenceEvents.INIT_STATE, onInitState);
      socket.unsubscribe(PresenceEvents.USER_LEFT_PROJECT, onLeave);
      socket.unsubscribe(PresenceEvents.USER_JOINED_PROJECT, onJoin);
    };
  }, [
    socket.connected,
    socket.emitEvent,
    socket.subscribe,
    socket.unsubscribe,
  ]);

  const value = useMemo(
    () => ({
      users,
      project,
      projectId,
      layoutState,
      projectContentContainerRef,
      navigate,
      setLayoutState,
      subscribeToUpdates: subscribeToEvent,
      emitUpdate: emitEvent,
    }),
    [
      users,
      project,
      projectId,
      layoutState,
      projectContentContainerRef,
      navigate,
      setLayoutState,
      subscribeToEvent,
      emitEvent,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>
      {project ? (
        children
      ) : fetching ? (
        <Box m="auto" textAlign="center">
          <PageLoading position="static" />
          <Text mt="2" color="muted">
            Fetching project...
          </Text>
        </Box>
      ) : (
        <ResourceUnavailable
          resource="project"
          title="Project unavailable"
          description="This project was not found, or you do not have access to it."
        />
      )}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === null) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
}
