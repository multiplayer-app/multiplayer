import { IDebugSession } from "@multiplayer/types";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import useMessage from "shared/hooks/useMessage";
import { getDebugSessions } from "shared/services/radar.service";

type UseSessionListReturn = {
  sessions: IDebugSession[];
  loadingInitial: boolean;
  loadingMore: boolean;
  loaded: boolean;
  hasMore: boolean;
  fetchInitialSessions: () => Promise<void>;
  fetchMoreSessions: () => Promise<void>;
};

const DEFAULT_PAGE_SIZE = 20;

export const useSessionList = (): UseSessionListReturn => {
  const { workspaceId, projectId } = useParams();
  const message = useMessage();

  const [sessions, setSessions] = useState<IDebugSession[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchInitialSessions = useCallback(async () => {
    if (!workspaceId || !projectId || loadingInitial) {
      return;
    }

    try {
      setLoadingInitial(true);
      const response = await getDebugSessions(workspaceId, projectId, {
        skip: 0,
        limit: DEFAULT_PAGE_SIZE,
        sortKey: "createdAt",
        sortDirection: "-1",
      } as any);
      setSessions(response.data ?? []);
      setSkip(response.cursor?.skip + (response.data?.length ?? 0));
      setTotal(response.cursor?.total ?? 0);
      setLoaded(true);
    } catch (error) {
      message.handleError(error);
    } finally {
      setLoadingInitial(false);
    }
  }, [workspaceId, projectId, loadingInitial, message]);

  const hasMore = sessions.length < total;

  const fetchMoreSessions = useCallback(async () => {
    if (
      !workspaceId ||
      !projectId ||
      !loaded ||
      loadingInitial ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    try {
      setLoadingMore(true);
      const response = await getDebugSessions(workspaceId, projectId, {
        skip,
        limit: DEFAULT_PAGE_SIZE,
        sortKey: "createdAt",
        sortDirection: "-1",
      } as any);

      setSessions((prev) => [...prev, ...(response.data ?? [])]);
      setSkip((prev) => prev + (response.data?.length ?? 0));
      setTotal(response.cursor?.total ?? total);
    } catch (error) {
      message.handleError(error);
    } finally {
      setLoadingMore(false);
    }
  }, [
    workspaceId,
    projectId,
    loaded,
    loadingInitial,
    loadingMore,
    hasMore,
    skip,
    total,
    message,
  ]);

  return {
    sessions,
    loadingInitial,
    loadingMore,
    loaded,
    hasMore,
    fetchInitialSessions,
    fetchMoreSessions,
  };
};
