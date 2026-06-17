import {
  useMemo,
  useEffect,
  useReducer,
  useContext,
  useCallback,
  createContext,
  useLayoutEffect,
} from "react";
import { useParams } from "react-router-dom";

import {
  setDataState,
  putDataState,
  setFetchedState,
  setFetchingState,
} from "shared/helpers/reducer.helpers";

import { ActionType } from "shared/models/types";
import { WorkspaceActions as Actions } from "shared/models/actions";

import * as WorkspaceService from "shared/services/workspace.service";
import * as UserService from "shared/services/user.service";

import {
  ITeam,
  IProject,
  IWorkspace,
  IWorkspaceUser,
  WorkspaceUserStatus,
} from "@multiplayer/types";
import { useAuth } from "./AuthContext";
import { fetchAllData } from "shared/helpers/api.helpers";
import { setGitInstanceBaseUrl } from "shared/services/git.service";
import { useBilling } from "shared/providers/BillingContext";
import { clone, getSubscriptionTypeName } from "shared/utils";
import { usePublicRoute } from "shared/hooks/usePublicRoute";
import { setLastWorkspaceId } from "shared/storage/workspaceStorage";
import { setLastProjectContext } from "shared/storage/lastProjectStorage";
import { invalidateWorkspaceProjectsNavCache } from "shared/navigation/workspaceProjectsNavCache";

export const unknownUser: IWorkspaceUser = {
  _id: "",
  user: "",
  workspace: "",
  lastName: "User",
  firstName: "Unknown",
  username: "unknownUser",
  color: "#A0AEC0",
  timezone: null,
  iconUrl: null,
  createdAt: null,
  updatedAt: null,
  status: WorkspaceUserStatus.PENDING,
  googleWorkspaceIntegration: false,
  googleWorkspaceToken: {
    refresh_token: "",
    expiry_date: 0,
    access_token: "",
    token_type: "",
    id_token: "",
    scope: "",
  },
};

export const WorkspaceProvider = ({ children }) => {
  const { user, updateSessions } = useAuth();
  const { workspaceId, projectId, branchId } = useParams();
  const { isPublic, hasWorkspaceAccess } = usePublicRoute();
  const { setAccountInfo, getCurrentSubscription, setSubscriptionType } =
    useBilling();
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const isCurrentUserTheOwner = useMemo(() => {
    const currentWorkspace = user?.workspaces.find(
      (w) => w._id === workspaceId
    );
    return currentWorkspace?.user?.workspaceOwner === true;
  }, [workspaceId, user]);

  const getWorkspace = useCallback(async (workspaceId: string) => {
    dispatch({ type: Actions.SET_WORKSPACE_FETCHING });
    try {
      const workspaceRes = await WorkspaceService.getWorkspace(workspaceId);
      if (!workspaceRes) {
        await updateSessions();
      } else {
        const { billing } = workspaceRes;
        const subscriptionName = getSubscriptionTypeName(
          billing?.stripe?.productName
        );
        setSubscriptionType(subscriptionName);
      }
      dispatch({ type: Actions.SET_WORKSPACE_DATA, payload: workspaceRes });
    } catch (error) {
      await updateSessions();
      dispatch({ type: Actions.SET_WORKSPACE_FETCHED });
    }
  }, []);

  const getWorkspaceAccount = useCallback(
    async (workspaceId: string) => {
      if (!!isCurrentUserTheOwner) {
        dispatch({ type: Actions.SET_ACCOUNT_FETCHING });
        try {
          const accountRes = await WorkspaceService.getWorkspaceAccount(
            workspaceId
          );
          setAccountInfo({ accountId: accountRes?._id, workspaceId });
          dispatch({ type: Actions.SET_ACCOUNT_DATA, payload: accountRes });
        } catch (error) {
          dispatch({ type: Actions.SET_ACCOUNT_FETCHED });
        }
      }
    },
    [isCurrentUserTheOwner]
  );

  const getWorkspaceUser = useCallback(async (workspaceId: string) => {
    dispatch({ type: Actions.SET_USER_FETCHING });
    try {
      const userRes = await UserService.getWorkspaceUser(workspaceId);
      dispatch({ type: Actions.SET_USER_DATA, payload: userRes });
    } catch (error) {
      dispatch({ type: Actions.SET_USER_FETCHED });
    }
  }, []);

  const getWorkspaceUsers = useCallback(async (workspaceId: string) => {
    dispatch({ type: Actions.SET_USERS_FETCHING });
    try {
      const members = await fetchAllData<IWorkspaceUser>(
        WorkspaceService.getWorkspaceUsers.bind(null, workspaceId)
      );
      dispatch({ type: Actions.SET_USERS_DATA, payload: members });
    } catch (error) {
      dispatch({ type: Actions.SET_USERS_FETCHED });
    }
  }, []);

  const getTeams = useCallback(async (workspaceId: string) => {
    dispatch({ type: Actions.SET_TEAMS_FETCHING });
    try {
      const teamsRes = await WorkspaceService.getTeams(workspaceId);
      dispatch({ type: Actions.SET_TEAMS_DATA, payload: teamsRes.data });
    } catch (error) {
      dispatch({ type: Actions.SET_TEAMS_FETCHED });
    }
  }, []);

  const createDefaultProject = useCallback(async (workspaceId: string) => {
    try {
      const newProject = await WorkspaceService.createProject(workspaceId, {
        name: "Main project",
      });
      return [newProject];
    } catch (creationError) {
      return [];
    }
  }, []);

  const getProjects = useCallback(
    async (workspaceId: string) => {
      dispatch({ type: Actions.SET_PROJECTS_FETCHING });
      try {
        const projectsRes = await WorkspaceService.getWorkspaceProjects(
          workspaceId,
          {}
        );
        const projects = projectsRes.data;

        if (!projects?.length && !isPublic && isCurrentUserTheOwner) {
          const defaultProject = await createDefaultProject(workspaceId);
          dispatch({
            type: Actions.SET_PROJECTS_DATA,
            payload: defaultProject,
          });
          invalidateWorkspaceProjectsNavCache(workspaceId);
          await updateSessions();
          return;
        }

        dispatch({ type: Actions.SET_PROJECTS_DATA, payload: projects });
        invalidateWorkspaceProjectsNavCache(workspaceId);
      } catch (error) {
        dispatch({ type: Actions.SET_PROJECTS_FETCHED });
      }
    },
    [createDefaultProject, isPublic, isCurrentUserTheOwner, updateSessions]
  );

  const updateWorkspace = useCallback((payload) => {
    dispatch({ type: Actions.PUT_WORKSPACE_DATA, payload });
  }, []);

  const cleanupWorkspace = useCallback(() => {
    dispatch({ type: Actions.CLEANUP });
  }, []);

  const fetchDashboardData = useCallback(
    async (id: string): Promise<void[]> => {
      if (!hasWorkspaceAccess) {
        dispatch({ type: Actions.SET_WORKSPACE_FETCHED });
        dispatch({ type: Actions.SET_USER_FETCHED });
        dispatch({ type: Actions.SET_USERS_FETCHED });
        dispatch({ type: Actions.SET_PROJECTS_FETCHED });
        dispatch({ type: Actions.SET_ACCOUNT_FETCHED });
        dispatch({ type: Actions.SET_TEAMS_FETCHED });
        return Promise.all([]);
      }

      return Promise.all([
        getWorkspace(id),
        getTeams(id),
        getProjects(id),
        getWorkspaceUser(id),
        getWorkspaceUsers(id),
        getWorkspaceAccount(id),
        getCurrentSubscription(id),
      ]);
    },
    [hasWorkspaceAccess]
  );

  useLayoutEffect(() => {
    if (workspaceId && workspaceId !== "create-workspace") {
      dispatch({ type: Actions.SET_WORKSPACE_ID, payload: workspaceId });
      // Store the workspace ID when it's in params and not create-workspace
      setLastWorkspaceId(workspaceId);
      if (projectId && branchId) {
        setLastProjectContext({
          workspaceId,
          projectId,
          branchId,
        });
      }
    }
  }, [workspaceId, projectId, branchId, user?._id]);

  useLayoutEffect(() => {
    if (workspaceId && workspaceId !== "create-workspace") {
      setGitInstanceBaseUrl(workspaceId);
      fetchDashboardData(workspaceId);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (state.user.data) {
      document.documentElement.style.setProperty(
        "--workspace-user-color",
        state.user.data.color
      );
    }
  }, [state.user.data]);

  const value = {
    ...state,
    isPublic,
    hasWorkspaceAccess,
    getTeams,
    getProjects,
    getWorkspace,
    getWorkspaceUser,
    getWorkspaceUsers,
    updateWorkspace,
    cleanupWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      <WorkspaceDispatchContext.Provider value={dispatch}>
        {children}
      </WorkspaceDispatchContext.Provider>
    </WorkspaceContext.Provider>
  );
};

export const WorkspaceDispatchContext = createContext(null);

export const WorkspaceContext = createContext<IWorkspaceStateContext | null>(
  null
);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === null) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}

export function useWorkspaceUsers() {
  const { users } = useWorkspace();

  return users.data;
}

export function useWorkspaceDispatch() {
  const context = useContext(WorkspaceDispatchContext);
  if (context === null) {
    throw new Error(
      "useWorkspaceDispatch must be used within WorkspaceProvider"
    );
  }
  return context;
}

interface IWorkspaceStateContext {
  isPublic: boolean;
  hasWorkspaceAccess: boolean;
  workspaceId: string;
  account: { data: { _id: string }; fetched: boolean; fetching: boolean };
  teams: { data: ITeam[]; fetched: boolean; fetching: boolean };
  projects: { data: IProject[]; fetched: boolean; fetching: boolean };
  user: { data: IWorkspaceUser; fetched: boolean; fetching: boolean };
  workspace: { data: IWorkspace; fetched: boolean; fetching: boolean };
  users: {
    data: Record<string, IWorkspaceUser>;
    fetched: boolean;
    fetching: boolean;
  };

  // Methods
  cleanupWorkspace: () => void;
  updateWorkspace: (arg: object) => void;
  getTeams: (arg: string) => Promise<void>;
  getProjects: (arg: string) => Promise<void>;
  getWorkspace: (arg: string) => Promise<void>;
  getWorkspaceUser: (arg: string) => Promise<void>;
  getWorkspaceUsers: (arg: string) => Promise<void>;
}

const initialState = {
  workspaceId: "",
  account: { data: null, fetched: false, fetching: true },
  workspace: { data: null, fetched: false, fetching: true },
  teams: { data: [], params: {}, fetched: false, fetching: true },
  users: { data: {}, params: {}, fetched: false, fetching: true },
  projects: { data: [], params: {}, fetched: false, fetching: true },
  user: { data: null, fetched: false, fetching: true },
};

const workspaceReducer = (state, action: ActionType) => {
  switch (action.type) {
    case Actions.CLEANUP:
      return clone(initialState);
    case Actions.SET_WORKSPACE_ID:
      return { ...state, workspaceId: action.payload };
    case Actions.SET_WORKSPACE_FETCHING:
      return setFetchingState(state, "workspace");
    case Actions.SET_WORKSPACE_FETCHED:
      return setFetchedState(state, "workspace");
    case Actions.SET_WORKSPACE_DATA:
      return setDataState(state, "workspace", action.payload);
    case Actions.PUT_WORKSPACE_DATA:
      return putDataState(state, "workspace", action.payload);

    case Actions.SET_TEAMS_FETCHING:
      return setFetchingState(state, "teams");
    case Actions.SET_TEAMS_FETCHED:
      return setFetchedState(state, "teams", []);
    case Actions.SET_TEAMS_DATA:
      return setDataState(state, "teams", action.payload);

    case Actions.SET_PROJECTS_FETCHING:
      return setFetchingState(state, "projects");
    case Actions.SET_PROJECTS_FETCHED:
      return setFetchedState(state, "projects", []);
    case Actions.SET_PROJECTS_DATA:
      return setDataState(state, "projects", action.payload);

    case Actions.SET_ACCOUNT_FETCHING:
      return setFetchingState(state, "account");
    case Actions.SET_ACCOUNT_FETCHED:
      return setFetchedState(state, "account", []);
    case Actions.SET_ACCOUNT_DATA:
      return setDataState(state, "account", action.payload);

    case Actions.SET_USERS_FETCHING:
      return setFetchingState(state, "users");
    case Actions.SET_USERS_FETCHED:
      return setFetchedState(state, "users", []);
    case Actions.SET_USERS_DATA:
      return setDataState(
        state,
        "users",
        action.payload?.reduce((acc, m) => {
          acc[m.workspaceUser._id] = m.workspaceUser;
          return acc;
        }, {})
      );

    case Actions.SET_USER_FETCHING:
      return setFetchingState(state, "user");
    case Actions.SET_USER_FETCHED:
      return setFetchedState(state, "user", null);
    case Actions.SET_USER_DATA:
      return setDataState(state, "user", action.payload);
    default:
      return state;
  }
};
