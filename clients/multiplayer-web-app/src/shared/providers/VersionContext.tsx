import {
  useEffect,
  useContext,
  useReducer,
  useCallback,
  createContext,
  useMemo,
  useLayoutEffect,
} from "react";

import {
  setDataState,
  setFetchedState,
  setFetchingState,
  updateFetchingParams,
} from "shared/helpers/reducer.helpers";

import * as VersionService from "shared/services/version.service";
import { VersionActions as Actions } from "shared/models/actions";
import {
  IBranchReview,
  IProjectBranch,
  ProjectBranchStatus,
} from "@multiplayer/types";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import {
  IGetBranchesReqParams,
  IListRes,
  IUpdateBranchReqBody,
} from "shared/models/interfaces";
import PageLoading from "shared/components/PageLoading";
import useMessage from "shared/hooks/useMessage";

export const VersionProvider = ({ children }) => {
  const message = useMessage();
  const navigate = useNavigate();

  const { workspaceId, projectId, branchId, sourceType, type, path } =
    useParams();
  const [state, dispatch] = useReducer(versionReducer, initialState);

  const isCurrentBranchLocked = useMemo(() => {
    if (!state.currentBranch.data) return true;

    return (
      state.currentBranch.data.status === ProjectBranchStatus.MERGED ||
      state.currentBranch.data.status === ProjectBranchStatus.CLOSED
    );
  }, [state.currentBranch]);

  const getBranches = useCallback(
    async (params: IGetBranchesReqParams) => {
      dispatch({ type: Actions.SET_BRANCHES_FETCHING, payload: params });
      try {
        const res = await VersionService.getBranches(params);
        dispatch({ type: Actions.SET_BRANCHES_DATA, payload: res });
      } catch (error) {
        dispatch({ type: Actions.SET_BRANCHES_FETCHED });
        message.handleError(error);
      }
    },
    [message]
  );

  const setBranchParams = useCallback((params: IGetBranchesReqParams) => {
    dispatch({
      type: Actions.SET_BRANCHES_PARAMS,
      payload: params,
    });
  }, []);

  const getDefaultProjectBranch = useCallback(async () => {
    dispatch({ type: Actions.SET_DEFAULT_BRANCH_FETCHING });
    try {
      const res = await VersionService.getDefaultProjectBranch();
      if (!res) throw new Error("Project branch not found!");
      dispatch({ type: Actions.SET_DEFAULT_BRANCH_DATA, payload: res });
      dispatch({ type: Actions.SET_DEFAULT_BRANCH_ID, payload: res?._id });
    } catch (error) {
      dispatch({ type: Actions.SET_DEFAULT_BRANCH_FETCHED });
    }
  }, []);

  const getCurrentBranchReviews = useCallback(
    async (branchId: string) => {
      dispatch({ type: Actions.SET_CURRENT_BRANCH_REVIEWS_FETCHING });
      try {
        const res = await VersionService.getBranchReviews(branchId);
        dispatch({
          type: Actions.SET_CURRENT_BRANCH_REVIEWS_DATA,
          payload: res.data,
        });
      } catch (error) {
        dispatch({ type: Actions.SET_CURRENT_BRANCH_REVIEWS_FETCHED });
        message.handleError(error);
      }
    },
    [message]
  );

  const getCurrentBranch = useCallback(
    async (branchId: string) => {
      dispatch({ type: Actions.SET_CURRENT_BRANCH_FETCHING });
      try {
        const res = await VersionService.getBranchById(branchId);
        if (!res) throw new Error("Project branch not found!");
        dispatch({ type: Actions.SET_CURRENT_BRANCH_DATA, payload: res });
        dispatch({ type: Actions.SET_CURRENT_BRANCH_ID, payload: branchId });
        if (!res.default) getCurrentBranchReviews(branchId);
      } catch (error) {
        dispatch({ type: Actions.SET_CURRENT_BRANCH_FETCHED });
        message.handleError(error);
      }
    },
    [message, getCurrentBranchReviews]
  );

  const openBranch = useCallback(
    (branchId: string) => {
      const entityPath =
        sourceType && type && path ? `/${sourceType}/${type}/${path}` : "";

      navigate(
        `/project/${workspaceId}/${projectId}/${branchId}${entityPath}`,
        { replace: true }
      );
    },
    [workspaceId, navigate, projectId]
  );

  const onBranchCreate = useCallback(
    (b: IProjectBranch) => {
      openBranch(b._id);
      if (state.branches.params) {
        getBranches(state.branches.params);
      }
    },
    [state.branches.params, openBranch, getBranches]
  );

  const onBranchUpdate = useCallback(
    async (branchId: string, body: Partial<IUpdateBranchReqBody>) => {
      try {
        const res = await VersionService.updateBranch(branchId, body);
        if (branchId === state.currentBranchId) {
          dispatch({ type: Actions.SET_CURRENT_BRANCH_DATA, payload: res });
        }
      } catch (error) {
        message.handleError(error);
      }
    },
    [state.currentBranchId]
  );

  const onBranchMappingUpdate = useCallback(
    async (branchId: string, gitRepositoryId: string, name: string) => {
      try {
        const res = await VersionService.updateBranchMapping(
          branchId,
          gitRepositoryId,
          name
        );
        if (branchId === state.currentBranchId) {
          dispatch({ type: Actions.SET_CURRENT_BRANCH_DATA, payload: res });
        }
      } catch (error) {
        message.handleError(error);
      }
    },
    [state.currentBranchId]
  );

  useLayoutEffect(() => {
    VersionService.setBaseUrl(workspaceId, projectId);
  }, [workspaceId, projectId]);

  useEffect(() => {
    getDefaultProjectBranch();
  }, [projectId, getDefaultProjectBranch]);

  useEffect(() => {
    if (branchId && branchId !== "default") {
      getCurrentBranch(branchId);
    }
  }, [branchId, getCurrentBranch]);

  useEffect(() => {
    if (branchId === "default" && state.defaultBranch.data) {
      dispatch({
        type: Actions.SET_CURRENT_BRANCH_DATA,
        payload: state.defaultBranch.data,
      });
      dispatch({
        type: Actions.SET_CURRENT_BRANCH_ID,
        payload: state.defaultBranch.data._id,
      });
    }
  }, [branchId, state.defaultBranch.data]);

  const value = useMemo(
    () => ({
      ...state,
      openBranch,
      getBranches,
      onBranchCreate,
      onBranchUpdate,
      setBranchParams,
      onBranchMappingUpdate,
      getCurrentBranchReviews,
      isCurrentBranchLocked,
    }),
    [
      state,
      openBranch,
      getBranches,
      onBranchCreate,
      onBranchUpdate,
      setBranchParams,
      onBranchMappingUpdate,
      getCurrentBranchReviews,
      isCurrentBranchLocked,
    ]
  );

  return (
    <VersionContext.Provider value={value}>
      <VersionDispatchContext.Provider value={dispatch}>
        {state.currentBranch.data ? (
          <>{children}</>
        ) : state.currentBranch.fetched ? (
          <Navigate
            to={`/project/${workspaceId}/${projectId}/default`}
            replace
          />
        ) : (
          <PageLoading />
        )}
      </VersionDispatchContext.Provider>
    </VersionContext.Provider>
  );
};

export const VersionDispatchContext = createContext(null);

export const VersionContext = createContext<IVersionStateContext | null>(null);

export function useVersion() {
  const context = useContext(VersionContext);
  if (context === null) {
    throw new Error("useVersion must be used within VersionProvider");
  }
  return context;
}

export function useVersionDispatch() {
  const context = useContext(VersionDispatchContext);
  if (context === null) {
    throw new Error("useVersionDispatch must be used within VersionProvider");
  }
  return context;
}

const initialState = {
  branches: {
    fetched: false,
    fetching: true,
    params: null,
    data: { data: [], cursor: { total: 0, skip: 0, limit: 0 } },
  },
  currentBranchId: null,
  currentBranch: { data: null, params: null, fetched: false, fetching: true },
  currentBranchReviews: { data: [], fetched: false, fetching: true },

  defaultBranchId: null,
  defaultBranch: { data: null, params: null, fetched: false, fetching: true },
};

const versionReducer = (state: any, action: any) => {
  switch (action.type) {
    case Actions.SET_DEFAULT_BRANCH_FETCHING:
      return setFetchingState(state, "defaultBranch");
    case Actions.SET_DEFAULT_BRANCH_FETCHED:
      return setFetchedState(state, "defaultBranch");
    case Actions.SET_DEFAULT_BRANCH_DATA:
      return setDataState(state, "defaultBranch", action.payload);
    case Actions.SET_DEFAULT_BRANCH_ID:
      return { ...state, defaultBranchId: action.payload };

    case Actions.SET_CURRENT_BRANCH_REVIEWS_FETCHING:
      return setFetchingState(state, "currentBranchReviews");
    case Actions.SET_CURRENT_BRANCH_REVIEWS_DATA:
      return setFetchedState(state, "currentBranchReviews", action.payload);
    case Actions.SET_CURRENT_BRANCH_REVIEWS_FETCHED:
      return setDataState(state, "currentBranchReviews", action.payload);

    case Actions.SET_CURRENT_BRANCH_FETCHING:
      return setFetchingState(state, "currentBranch");
    case Actions.SET_CURRENT_BRANCH_FETCHED:
      return setFetchedState(state, "currentBranch");
    case Actions.SET_CURRENT_BRANCH_DATA:
      return setDataState(state, "currentBranch", action.payload);
    case Actions.SET_CURRENT_BRANCH_ID:
      return { ...state, currentBranchId: action.payload };

    case Actions.SET_BRANCHES_PARAMS:
      return updateFetchingParams(state, "branches", action.payload);
    case Actions.SET_BRANCHES_FETCHING:
      return setFetchingState(state, "branches", action.payload);
    case Actions.SET_BRANCHES_FETCHED:
      return setFetchedState(state, "branches");
    case Actions.SET_BRANCHES_DATA:
      const payload = {
        cursor: action.payload.cursor,
        data: action.payload.cursor.skip
          ? [...state.branches.data.data, ...action.payload.data]
          : action.payload.data,
      };
      return setDataState(state, "branches", payload);
    default:
      return state;
  }
};

interface IVersionStateContext {
  currentBranchId: string;
  isCurrentBranchLocked: boolean;
  currentBranch: { data: IProjectBranch; fetched: boolean; fetching: boolean };
  currentBranchReviews: {
    data: IBranchReview[];
    fetched: boolean;
    fetching: boolean;
  };
  defaultBranchId: string;
  defaultBranch: { data: IProjectBranch; fetched: boolean; fetching: boolean };
  branches: {
    fetched: boolean;
    fetching: boolean;
    data: IListRes<IProjectBranch>;
    params: IGetBranchesReqParams;
  };
  // Methods
  setBranchParams: (params: Partial<IGetBranchesReqParams>) => void;
  getBranches: (params: IGetBranchesReqParams) => Promise<void>;
  getCurrentBranchReviews: (id: string) => Promise<void>;
  // UI
  openBranch: (branchId: string) => void;
  onBranchCreate: (branch: IProjectBranch) => void;
  onBranchUpdate: (
    id: string,
    body: Partial<IUpdateBranchReqBody>
  ) => Promise<void>;
  onBranchMappingUpdate: (
    branchId: string,
    gitRepositoryId: string,
    name: string
  ) => Promise<void>;
}
