import { IIssue, IssueSeverityLevel } from "@multiplayer/types";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import { getIssues, updateIssuesBulk } from "shared/services/radar.service";
import { IIssuesFilters, IListRes } from "shared/models/interfaces";
import useMessage from "shared/hooks/useMessage";
import {
  getCombinedIssuesFilters,
  useIssuesFilters,
} from "shared/hooks/useIssuesFilters";
import { ISSUE_HASH_KEY } from "shared/configs/issues.configs";

interface IIssuesContext {
  issues: IListRes<IIssue>;
  loading: boolean;
  hasFilters: boolean;
  filters: IIssuesFilters;
  issuesStateRef: React.MutableRefObject<{ scrollTop: number }>;
  setFilters: React.Dispatch<React.SetStateAction<IIssuesFilters>>;
  updateIssueInTheList: (payload: IIssue) => void;
  updateIssueSeverity: (issue: IIssue, severity: IssueSeverityLevel) => void;
}

const IssuesContext = createContext<IIssuesContext | null>(null);

const IssuesProvider = ({ children }: { children: ReactNode }) => {
  const message = useMessage();
  const issuesStateRef = useRef({ scrollTop: 0 });
  const [loading, setLoading] = useState(true);
  const { workspaceId, projectId } = useParams();
  const { filters, setFilters } = useIssuesFilters();

  const [issues, setIssues] = useState<IListRes<IIssue>>({
    data: [],
    cursor: {
      total: 0,
      skip: 0,
      limit: 10,
    },
  });

  const getIssuesFn = useCallback(async () => {
    try {
      setLoading(true);
      const params = getCombinedIssuesFilters(filters);
      const res = await getIssues(workspaceId, projectId, params);
      setIssues({
        cursor: res.cursor,
        data: res.data,
      });
    } catch (err) {
      console.error("Error fetching issues:", err);
      message.handleError(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, filters, message]);

  const updateIssueInTheList = useCallback((payload: IIssue) => {
    setIssues((prev) => ({
      ...prev,
      data: prev.data.map((issue) =>
        issue._id === payload._id ? { ...issue, ...payload } : issue
      ),
    }));
  }, []);

  useEffect(() => {
    getIssuesFn();
  }, [getIssuesFn]);

  const updateIssueSeverity = useCallback(
    async (issue: IIssue, severity: IssueSeverityLevel) => {
      try {
        await updateIssuesBulk(workspaceId, projectId, {
          filter: { [ISSUE_HASH_KEY]: [issue[ISSUE_HASH_KEY]] },
          payload: { severity },
        });
        const updatedIssue = { ...issue, severity };
        updateIssueInTheList(updatedIssue);
      } catch (error) {
        message.handleError(error);
      }
    },
    [workspaceId, projectId]
  );

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.title ||
          filters.text ||
          filters.severity ||
          filters.resolved !== undefined ||
          filters.archived !== undefined ||
          filters.lastSeen?.gte ||
          filters.lastSeen?.lte ||
          filters["service.serviceNameSlug"] ||
          filters["service.environmentSlug"]
      ),
    [filters]
  );

  return (
    <IssuesContext.Provider
      value={{
        issues,
        loading,
        filters,
        hasFilters,
        issuesStateRef,
        setFilters,
        updateIssueInTheList,
        updateIssueSeverity,
      }}
    >
      {children}
    </IssuesContext.Provider>
  );
};

export function useIssues() {
  const context = useContext(IssuesContext);
  if (context === null) {
    throw new Error("useIssues must be used within IssuesProvider");
  }
  return context;
}

/** When the issue UI is mounted outside Issues (e.g. agent session side panel), list sync is skipped. */
export function useIssuesOptional() {
  return useContext(IssuesContext);
}

export { IssuesProvider };
