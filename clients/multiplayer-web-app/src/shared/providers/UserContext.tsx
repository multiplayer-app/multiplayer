import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import {
  listEndUserIssues,
  getEndUser,
  startEndUserRemoteSessionRecording,
  stopEndUserRemoteSessionRecording,
} from "shared/services/radar.service";
import useMessage from "shared/hooks/useMessage";
import { IssueRateChartPeriod, SortingDirection } from "shared/models/enums";
import { EndUserState, IEndUser, IssueSeverityLevel } from "@multiplayer/types";
import { MetricsGranularityMap } from "shared/hooks/useIssuesFilters";
import { useUsers } from "shared/providers/UsersContext";

interface IUserData {
  issues: any;
  data: IEndUser;
}

interface IIssueFilters {
  resolved?: boolean;
  archived?: boolean;
  severity?: IssueSeverityLevel;
  lastSeen?: {
    gte?: string;
    lte?: string;
  };
  params: { skip: number; limit: number };
  sorting: { key: string; direction: SortingDirection };
}

interface IUserContext {
  user: IUserData | null;
  loading: boolean;
  isRecording: boolean;
  selectedEvent: any;
  setSelectedEvent: React.Dispatch<any>;
  startRecording: () => void;
  stopRecording: () => void;
  refetchUser: () => Promise<void>;
  issueFilters: IIssueFilters;
  setIssueFilters: React.Dispatch<React.SetStateAction<IIssueFilters>>;
  setMetricsPeriod: React.Dispatch<React.SetStateAction<IssueRateChartPeriod>>;
  metricsPeriod: IssueRateChartPeriod;
}

const UserContext = createContext<IUserContext | null>(null);

const isEndUserRecording = (endUser?: IEndUser | null) => {
  return Boolean(
    endUser?.connections?.some(
      (connection) => connection.state === EndUserState.RECORDING
    )
  );
};

const UserProvider = ({ children }: { children: ReactNode }) => {
  const message = useMessage();
  const { workspaceId, projectId, path: userId } = useParams();
  const { updatedUser } = useUsers();
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [metricsPeriod, setMetricsPeriod] = useState<IssueRateChartPeriod>(
    IssueRateChartPeriod.DAY_30
  );
  const [user, setUser] = useState<IUserData>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [issueFilters, setIssueFilters] = useState<IIssueFilters>({
    resolved: undefined,
    archived: undefined,
    severity: undefined,
    lastSeen: undefined,
    sorting: { key: "lastSeen", direction: SortingDirection.DESC },
    params: { skip: 0, limit: 20 },
  });

  const fetchUser = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    try {
      const userData = await getEndUser(workspaceId, projectId, userId, {
        ...(metricsPeriod && {
          "metrics.to": MetricsGranularityMap[metricsPeriod].to(),
          "metrics.from": MetricsGranularityMap[metricsPeriod].from(),
          "metrics.granularity":
            MetricsGranularityMap[metricsPeriod].granularity,
        }),
      });
      const issues = await listEndUserIssues(workspaceId, projectId, userId);
      setUser({ issues, data: userData });
      setIsRecording(isEndUserRecording(userData));
    } catch (error) {
      console.error("Error fetching user data:", error);
      message.handleError(error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, userId, message, metricsPeriod]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    fetchUser();
  }, [fetchUser, userId]);

  useEffect(() => {
    if (!updatedUser?._id || updatedUser._id !== user?.data?._id) {
      return;
    }

    setUser((prevState) => ({
      ...prevState,
      data: updatedUser,
    }));
    setIsRecording(isEndUserRecording(updatedUser));
  }, [updatedUser, user?.data?._id]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchIssue = async () => {
      try {
        const issues = await listEndUserIssues(workspaceId, projectId, userId);
        setUser((prev) => ({
          ...prev,
          issues,
        }));
      } catch (error) {
        message.handleError(error);
      }
    };

    fetchIssue();
  }, [issueFilters]);

  const startRecording = async () => {
    try {
      await startEndUserRemoteSessionRecording(workspaceId, projectId, userId);
      setIsRecording(true);
    } catch (err) {
      message.handleError(err);
    }
  };

  const stopRecording = async () => {
    try {
      await stopEndUserRemoteSessionRecording(workspaceId, projectId, userId);
      setIsRecording(false);
    } catch (err) {
      message.handleError(err);
    }
  };

  const contextValue = useMemo<IUserContext>(
    () => ({
      user,
      loading,
      selectedEvent,
      setSelectedEvent,
      startRecording,
      stopRecording,
      refetchUser: fetchUser,
      isRecording,
      issueFilters,
      setIssueFilters,
      metricsPeriod,
      setMetricsPeriod,
    }),
    [
      user,
      loading,
      selectedEvent,
      isRecording,
      issueFilters,
      metricsPeriod,
      startRecording,
      stopRecording,
      fetchUser,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = (): IUserContext => {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

export { UserProvider };
