import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import useMessage from "shared/hooks/useMessage";
import { useParams, useSearchParams } from "react-router-dom";
import {
  IListRes,
  IReqParamsBase,
  ITableSorting,
} from "shared/models/interfaces";
import {
  deleteEndUsers,
  getEndUsers,
  startBulkEndUserRemoteSessionRecording,
  stopBulkEndUserRemoteSessionRecording,
  updateEndUserSessionRecordingSettings,
  updateEndUserSessionRecordingSettingsBulk,
} from "shared/services/radar.service";
import { EndUserRecordingSettings } from "shared/models/interfaces";
import {
  EndUserType,
  IEndUser,
  SessionRecordingNextRecordType,
} from "@multiplayer/types";
import {
  IssueRateChartPeriod,
  PostHogEvents,
  SortingDirection,
  SortingDirectionMap,
  UserStatus,
} from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { MetricsGranularityMap } from "shared/hooks/useIssuesFilters";
import { useRadarSocket } from "shared/hooks/useRadarSocket";

interface IUsersFilters extends IReqParamsBase {
  sorting?: ITableSorting;
  company?: string;
  type?: EndUserType;
  tags?: any[];
  status?: UserStatus;
  text?: string;
  environment?: string;
  period?: IssueRateChartPeriod;
  lastSeen?: {
    gte?: string;
    lte?: string;
  };
}
interface IUsersContext {
  users: IListRes<IEndUser>;
  updatedUser: IEndUser;
  loading: boolean;
  isRecording: boolean;
  filters: IUsersFilters;
  deleteUsers: (selectedIds: string[]) => void;
  setFilters: React.Dispatch<React.SetStateAction<IUsersFilters>>;
  startBulkRecording: (selectedIds: string[]) => void;
  stopBulkRecording: (selectedIds: string[]) => void;
  updateUsersRecordingSettings: (
    selectedIds: string[],
    payload: EndUserRecordingSettings
  ) => Promise<void>;
}

enum EndUserEvents {
  END_USER_SUBSCRIBE_PROJECT = "end-user:workspace:project:subscribe",
  END_USER_UNSUBSCRIBE_PROJECT = "end-user:workspace:project:unsubscribe",
  END_USER_CONNECTED_EVENT = "end-user:connected",
  END_USER_CONNECTION_STATE_UPDATE_EVENT = "end-user:connection-state-updated",
  REMOTE_SESSION_RECORDING_START = "debug-session:remote:start",
  REMOTE_SESSION_RECORDING_STOP = "debug-session:remote:stop",
}

const UsersContext = createContext<IUsersContext | null>(null);

const DEFAULT_USERS_PAGE_SIZE = 20;

const parseUsersPageParams = (searchParams: URLSearchParams) => {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize =
    parseInt(searchParams.get("pageSize") || "", 10) || DEFAULT_USERS_PAGE_SIZE;
  return { skip: (page - 1) * pageSize, limit: pageSize };
};

const UsersProvider = ({ children }: { children: ReactNode }) => {
  const message = useMessage();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const { workspaceId, projectId, path: userId } = useParams();
  const { socket } = useRadarSocket({
    workspaceId,
    projectId,
    namespace: "end-users",
    enabled: Boolean(workspaceId && projectId),
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRecording, setIsRecording] = useState(false);

  const initialPageParams = parseUsersPageParams(searchParams);
  const [filters, setFilters] = useState<IUsersFilters>({
    sorting: { key: "lastSeen", direction: SortingDirection.DESC },
    skip: initialPageParams.skip,
    limit: initialPageParams.limit,
    company: "",
    type: EndUserType.USER,
    tags: [],
    status: undefined,
    text: "",
    lastSeen: undefined,
    environment: "",
    period: IssueRateChartPeriod.DAY_7,
  });

  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;

  useEffect(() => {
    const page = Math.floor(filters.skip / filters.limit) + 1;
    setSearchParamsRef.current(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (page > 1) {
          next.set("page", String(page));
        } else {
          next.delete("page");
        }
        if (filters.limit !== DEFAULT_USERS_PAGE_SIZE) {
          next.set("pageSize", String(filters.limit));
        } else {
          next.delete("pageSize");
        }
        return next;
      },
      { replace: true }
    );
  }, [filters.skip, filters.limit]);
  const [updatedUser, setUpdatedUser] = useState<IEndUser>(null);
  const [users, setUsers] = useState<IListRes<IEndUser>>({
    data: [],
    cursor: {
      total: 0,
      skip: 0,
      limit: 10,
    },
  });

  useEffect(() => {
    if (!socket || !workspaceId || !projectId) {
      return;
    }

    socket.emit(EndUserEvents.END_USER_SUBSCRIBE_PROJECT, {
      workspaceId,
      projectId,
    });

    const onEndUserUpdated = ({ data }: { data: IEndUser }) => {
      if (data?._id) {
        setUsers((prevState) => ({
          ...prevState,
          data: prevState.data.map((user: IEndUser) =>
            user._id === data._id ? data : user
          ),
        }));
        setUpdatedUser(data);
      }
    };

    socket.on(EndUserEvents.END_USER_CONNECTED_EVENT, onEndUserUpdated);
    socket.on(
      EndUserEvents.END_USER_CONNECTION_STATE_UPDATE_EVENT,
      onEndUserUpdated
    );

    return () => {
      socket.off(EndUserEvents.END_USER_CONNECTED_EVENT, onEndUserUpdated);
      socket.off(
        EndUserEvents.END_USER_CONNECTION_STATE_UPDATE_EVENT,
        onEndUserUpdated
      );

      socket.emit(EndUserEvents.END_USER_UNSUBSCRIBE_PROJECT, {
        workspaceId,
        projectId,
      });
    };
  }, [socket, workspaceId, projectId, setUsers, setUpdatedUser]);

  const getUsersFn = useCallback(async () => {
    try {
      setLoading(true);
      const params = getCombinedUsersFilters(filters);
      const res = await getEndUsers(workspaceId, projectId, params);
      setUsers({
        cursor: res.cursor,
        data: res.data,
      });
    } catch (err) {
      message.handleError(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, filters, message]);

  useEffect(() => {
    if (!userId) {
      getUsersFn();
    }
  }, [getUsersFn, userId]);

  const deleteUsers = async (selectedIds: string[]) => {
    try {
      await deleteEndUsers(workspaceId, projectId, { ids: selectedIds });
      setUsers((prev) => ({
        cursor: {
          ...prev.cursor,
          total: prev.cursor.total - selectedIds.length,
        },
        data: prev.data.filter((user) => !selectedIds.includes(user._id)),
      }));
      trackEvent(PostHogEvents.END_USERS_DELETED, { ids: selectedIds });
    } catch (err) {
      message.handleError(err);
    }
  };

  const startBulkRecording = async (selectedIds: string[]) => {
    try {
      await startBulkEndUserRemoteSessionRecording(workspaceId, projectId, {
        ids: selectedIds,
      });
      setIsRecording(true);
      // Emit socket event for bulk recording start
      socket?.emit(EndUserEvents.REMOTE_SESSION_RECORDING_START, {
        userIds: selectedIds,
        projectId,
        workspaceId,
      });
    } catch (err) {
      message.handleError(err);
    }
  };

  const stopBulkRecording = async (selectedIds: string[]) => {
    try {
      await stopBulkEndUserRemoteSessionRecording(workspaceId, projectId, {
        ids: selectedIds,
      });
      setIsRecording(false);
      // Emit socket event for bulk recording stop
      socket?.emit(EndUserEvents.REMOTE_SESSION_RECORDING_STOP, {
        userIds: selectedIds,
        projectId,
        workspaceId,
      });
    } catch (err) {
      message.handleError(err);
    }
  };

  const updateUsersRecordingSettings = async (
    selectedIds: string[],
    payload: EndUserRecordingSettings
  ) => {
    try {
      if (selectedIds.length > 1) {
        await updateEndUserSessionRecordingSettingsBulk(
          workspaceId,
          projectId,
          {
            ...payload,
            ids: selectedIds,
          }
        );
      } else {
        await updateEndUserSessionRecordingSettings(
          workspaceId,
          projectId,
          selectedIds[0],
          payload
        );
      }

      // Update local state with new settings
      setUsers((prev) => ({
        ...prev,
        data: prev.data.map((user): IEndUser => {
          if (selectedIds.includes(user._id)) {
            return {
              ...user,
              conditionalRecordingSettings: {
                ...user.conditionalRecordingSettings,
                whenToRecord:
                  payload.whenToRecord as SessionRecordingNextRecordType,
                sessionRecordingsLimit: payload.sessionRecordingsLimit,
              },
            };
          }
          return user;
        }),
      }));
    } catch (err) {
      message.handleError(err);
      throw err;
    }
  };

  return (
    <UsersContext.Provider
      value={{
        users,
        updatedUser,
        loading,
        filters,
        isRecording,
        deleteUsers,
        setFilters,
        startBulkRecording,
        stopBulkRecording,
        updateUsersRecordingSettings,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export const getCombinedUsersFilters = (filters: IUsersFilters) => {
  const {
    sorting,
    skip,
    limit,
    lastSeen,
    text,
    type,
    company,
    period,
    environment,
    status,
  } = filters;
  return {
    skip,
    limit,
    ...(sorting && {
      sortKey: sorting.key,
      sortDirection: SortingDirectionMap[sorting.direction],
    }),
    ...(text && { text }),
    ...(company && { "attributes.orgName": company }),
    ...(type && { "attributes.type": type }),
    ...(status && { online: status === UserStatus.ACTIVE }),
    ...(environment && { "attributes.environment": environment }),
    ...(lastSeen?.gte && { "lastSeen.gte": lastSeen.gte }),
    ...(lastSeen?.lte && { "lastSeen.lte": lastSeen.lte }),
    ...(MetricsGranularityMap[period] && {
      "metrics.to": MetricsGranularityMap[period].to(),
      "metrics.from": MetricsGranularityMap[period].from(),
      "metrics.granularity": MetricsGranularityMap[period].granularity,
    }),
  };
};

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === null) {
    throw new Error("useUsers must be used within UsersProvider");
  }
  return context;
}

export { UsersProvider };
