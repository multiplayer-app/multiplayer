import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  RoleAccessAction,
  FeatureFlag,
  IRole,
  RoleType,
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity,
  RoleAccountPermissionEntity,
} from "@multiplayer/types";

import {
  setDataState,
  setFetchedState,
  setFetchingState,
} from "shared/helpers/reducer.helpers";

import { ActionType } from "shared/models/types";
import { clone, setNestedProperty } from "shared/utils";
import { PermissionActions as Actions } from "shared/models/actions";
import { getRoles } from "shared/services/permissions.service";
import { useAuth } from "shared/providers/AuthContext";
import { useBilling } from "shared/providers/BillingContext";
import { useWorkspace } from "./WorkspaceContext";
import { SubscriptionType, UserActions } from "shared/models/enums";
import { useParams } from "react-router-dom";
import {
  getAccountRole,
  getProjectRole,
  getWorkspaceRole,
} from "shared/services/workspace.service";

const actionPermissions: Record<UserActions, SubscriptionType[]> = {
  [UserActions.SETUP_DEBUGGER]: [
    SubscriptionType.teams,
    SubscriptionType.enterprise,
  ],
  [UserActions.RECORD_SESSION]: [
    SubscriptionType.teams,
    SubscriptionType.enterprise,
  ],
  [UserActions.UPDATE_DEBUGGER]: [
    SubscriptionType.teams,
    SubscriptionType.enterprise,
  ],
};

export const PermissionsProvider = ({ children }) => {
  const isSandboxRef = useRef(false);
  const { user } = useAuth();
  const { subscriptionType } = useBilling();

  const { workspaceId, projectId } = useParams();
  const { workspace, isPublic } = useWorkspace();
  const [state, dispatch] = useReducer(permissionsReducer, initialState);
  const { roles, permissions, featureFlags } = state;

  const {
    [RoleType.ACCOUNT]: accountRole,
    [RoleType.PROJECT]: projectRoles,
    [RoleType.WORKSPACE]: workspaceRoles,
  } = roles.data;

  const getPermissionRoles = useCallback(async () => {
    if (workspaceId && !isPublic) {
      dispatch({ type: Actions.SET_ROLES_FETCHING });
      try {
        const groupedRoles = await getGroupedRoles(workspaceId);
        dispatch({ type: Actions.SET_ROLES_DATA, payload: groupedRoles });
      } catch (error) {
        dispatch({ type: Actions.SET_ROLES_FETCHED });
      }
    }
  }, [workspaceId, isPublic]);

  const setFeatureFlags = useCallback(
    (featureFlags: Record<FeatureFlag, boolean>) => {
      dispatch({
        type: Actions.SET_FEATURE_FLAGS_DATA,
        payload: { ...initialFeatureFlags, ...featureFlags },
      });
    },
    []
  );

  useEffect(() => {
    if (workspace.data) {
      dispatch({
        type: Actions.SET_FEATURE_FLAGS_DATA,
        payload: {
          ...initialFeatureFlags,
          ...(workspace.data.featureFlags || {}),
        },
      });
    } else {
      dispatch({
        type: Actions.SET_FEATURE_FLAGS_DATA,
        payload: { ...initialFeatureFlags },
      });
    }
  }, [workspace.data]);

  useEffect(() => {
    const getRoles = async () => {
      dispatch({ type: Actions.SET_PERMISSIONS_FETCHING });
      const promises = [
        user ? getAccountRole(user._id) : null,
        workspaceId && !isPublic ? getWorkspaceRole(workspaceId) : null,
        projectId && workspaceId
          ? getProjectRole(workspaceId, projectId)
          : null,
      ];

      try {
        const [account, workspace, project] = await Promise.all(promises);
        dispatch({
          type: Actions.SET_PERMISSIONS_DATA,
          payload: {
            [RoleType.ACCOUNT]: getRolePermissions(account),
            [RoleType.PROJECT]: getRolePermissions(project),
            [RoleType.WORKSPACE]: getRolePermissions(workspace),
          },
        });
      } catch (error) {
        dispatch({ type: Actions.SET_PERMISSIONS_FETCHED });
      }
    };

    getRoles();
  }, [projectId, workspaceId, user, isPublic]);

  useEffect(() => {
    if (!isPublic) {
      getPermissionRoles();
    }
  }, [getPermissionRoles, isPublic]);

  const getGroupedRoles = useCallback(async (workspaceId: string) => {
    const { data } = await getRoles(workspaceId);
    return data.reduce((acc, item) => {
      setNestedProperty(acc, [item.type, item._id], item);
      return acc;
    }, clone(initialRoles));
  }, []);

  const canPerformAction = useCallback(
    (action: UserActions): boolean => {
      const allowedSubscriptions = actionPermissions[action];
      // Check if the user's subscription type is in the allowed subscriptions list for the action
      return allowedSubscriptions.includes(SubscriptionType[subscriptionType]);
    },
    [subscriptionType]
  );

  const hasFeature = useCallback(
    (flag: FeatureFlag) => {
      return flag ? featureFlags.data[flag] : true;
    },
    [featureFlags.data]
  );

  const hasAccess = useCallback(
    (
      entity:
        | RoleProjectPermissionEntity
        | RoleWorkspacePermissionEntity
        | RoleAccountPermissionEntity,
      permission: RoleAccessAction,
      scope: RoleType = RoleType.WORKSPACE
    ): boolean => {
      const role = permissions.data?.[scope];
      const access = role?.get(entity)?.has(permission);
      return !!access;
    },
    [permissions.data]
  );

  return (
    <PermissionsContext.Provider
      value={{
        roles,
        permissions,
        featureFlags,
        accountRole,
        projectRoles,
        workspaceRoles,
        isSandboxRef,
        hasFeature,
        hasAccess,
        canPerformAction,
        getGroupedRoles,
        setFeatureFlags,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const PermissionsContext = createContext<IPermissionsContext | null>(
  null
);

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === null) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return context;
}

export function useAccessCheck(
  entity:
    | RoleProjectPermissionEntity
    | RoleWorkspacePermissionEntity
    | RoleAccountPermissionEntity,
  permission: RoleAccessAction,
  scope: RoleType = RoleType.WORKSPACE,
  bypassPermissions = false
) {
  const { hasAccess } = usePermissions();

  return useMemo(
    () => hasAccess(entity, permission, scope) || bypassPermissions,
    [hasAccess, entity, permission, scope, bypassPermissions]
  );
}

export function useFeatureFlagCheck(opts: FeatureFlag | FeatureFlag[]) {
  const { featureFlags } = usePermissions();
  return useMemo(() => {
    const flags = Array.isArray(opts) ? opts : [opts];
    return flags.every((key) => featureFlags.data[key]);
  }, [opts, featureFlags.data]);
}

export type IRoleData = Record<RoleType, Record<string, IRole>>;

export type IPermissionsData = Record<
  RoleType,
  Map<
    RoleProjectPermissionEntity | RoleWorkspacePermissionEntity,
    Set<RoleAccessAction>
  >
>;
interface IPermissionsContext {
  isSandboxRef: React.MutableRefObject<boolean>;
  accountRole: IRole;
  projectRoles: Record<string, IRole>;
  workspaceRoles: Record<string, IRole>;
  roles: { data: IRoleData; fetched: boolean; fetching: boolean };
  permissions: { data: IPermissionsData; fetched: boolean; fetching: boolean };
  featureFlags: {
    data: Record<FeatureFlag, boolean>;
    fetched: boolean;
    fetching: boolean;
  };
  hasAccess: (
    entity:
      | RoleProjectPermissionEntity
      | RoleWorkspacePermissionEntity
      | RoleAccountPermissionEntity,
    permission: RoleAccessAction,
    scope?: RoleType
  ) => boolean;
  hasFeature: (flag: FeatureFlag) => boolean;
  getGroupedRoles: (workspaceId: string) => any;
  canPerformAction: (action: UserActions) => boolean;
  setFeatureFlags: (featureFlags: Record<FeatureFlag, boolean>) => void;
}

const initialRoles = {
  [RoleType.ACCOUNT]: {},
  [RoleType.PROJECT]: {},
  [RoleType.WORKSPACE]: {},
};

// Set correct value after full implementation
const initialFeatureFlags: Record<FeatureFlag, boolean> = {
  [FeatureFlag.RADAR]: false,
  [FeatureFlag.RADAR_DETECT_ENDPOINTS]: false,
  [FeatureFlag.RADAR_DETECT_ENDPOINT_PAYLOAD]: false,
  [FeatureFlag.RADAR_DEPENDENCIES]: false,
  [FeatureFlag.ASSISTANT]: false,
  [FeatureFlag.END_USERS]: false,
  [FeatureFlag.FLOWS]: false,
  [FeatureFlag.SKETCH]: false,
  [FeatureFlag.NOTEBOOK]: false,
  [FeatureFlag.REPOSITORY]: false,
  [FeatureFlag.PLATFORM]: false,
  [FeatureFlag.VARIABLE_GROUP]: false,
  [FeatureFlag.PROJECT_BRANCH]: false,
  [FeatureFlag.ALERT_RULES]: false,
  [FeatureFlag.CONDITIONAL_RECORDING]: false,
  [FeatureFlag.AGENTS]: true,
  [FeatureFlag.ISSUES]: true,
  [FeatureFlag.DEBUG_SESSION]: true,
};

const initialState = {
  roles: { data: clone(initialRoles), fetched: false, fetching: true },
  featureFlags: {
    fetched: false,
    fetching: false,
    data: clone(initialFeatureFlags),
  },
  permissions: {
    data: {
      [RoleType.ACCOUNT]: new Map(),
      [RoleType.PROJECT]: new Map(),
      [RoleType.WORKSPACE]: new Map(),
    },
    fetched: false,
    fetching: true,
  },
};

const permissionsReducer = (state, action: ActionType) => {
  switch (action.type) {
    case Actions.CLEANUP:
      return { ...initialState };
    case Actions.SET_ROLES_FETCHING:
      return setFetchingState(state, "roles");
    case Actions.SET_ROLES_FETCHED:
      return setFetchedState(state, "roles", {});
    case Actions.SET_ROLES_DATA:
      return setDataState(state, "roles", action.payload);
    case Actions.SET_PERMISSIONS_DATA:
      return setDataState(state, "permissions", action.payload);
    case Actions.SET_PERMISSIONS_FETCHING:
      return setFetchingState(state, "permissions");
    case Actions.SET_PERMISSIONS_FETCHED:
      return setFetchedState(state, "permissions");
    case Actions.SET_FEATURE_FLAGS_DATA:
      return setDataState(state, "featureFlags", action.payload);
    default:
      return state;
  }
};

const getRolePermissions = (
  role: IRole
): Map<string, Set<RoleAccessAction>> => {
  if (!role) return new Map();
  return new Map(role.permissions.map((p) => [p.entity, new Set(p.access)]));
};
