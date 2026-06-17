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
  CallbackData,
  CommentCreatePayload,
  ObjectTypeEnum,
  CommentsEvents,
  IComment,
  IThread,
  IThreadResponse,
  SortOrder,
  ThreadCreatePayload,
  ThreadStatus,
  ThreadUpdatePayload,
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import { useParams } from "react-router-dom";

import { getComments, getThreads } from "shared/services/thread.service";
import { IGetThreadsReqParams, IListRes } from "shared/models/interfaces";
import { useSocket } from "./SocketContext";
import EventEmitter from "events";
import useMessage from "shared/hooks/useMessage";
import { usePermissions } from "./PermissionsContext";

export const ThreadsProvider = ({
  children,
  branchId = undefined,
  objectId = undefined,
  objectType = ObjectTypeEnum.ENTITY,
}) => {
  const message = useMessage();
  const threadEvents = useRef(new EventEmitter());
  const { hasAccess } = usePermissions();
  const [loading, setLoading] = useState(true);
  const { workspaceId, projectId } = useParams();
  const { emitEvent, subscribe, unsubscribe } = useSocket();
  const [params, setParams] = useState<IGetThreadsReqParams>({
    objectId,
    branchId,
    objectType,
    skip: null,
    limit: 100,
    status: ThreadStatus.ACTIVE,
    sortOrder: SortOrder.ASC,
  });

  const [threads, setThreads] = useState<IListRes<IThreadResponse>>({
    data: [],
    cursor: { skip: 0, limit: 0, total: 0 },
    totalComments: 0,
  });

  const [comments, setComments] = useState({});
  const [selectedThread, selectThread] = useState(null);

  const access = useMemo(
    () => ({
      read: hasAccess(
        RoleProjectPermissionEntity.COMMENT,
        RoleAccessAction.READ,
        RoleType.PROJECT
      ),
      create: hasAccess(
        RoleProjectPermissionEntity.COMMENT,
        RoleAccessAction.CREATE,
        RoleType.PROJECT
      ),
      update: hasAccess(
        RoleProjectPermissionEntity.COMMENT,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
      delete: hasAccess(
        RoleProjectPermissionEntity.COMMENT,
        RoleAccessAction.DELETE,
        RoleType.PROJECT
      ),
    }),
    [hasAccess]
  );

  const createThread = useCallback(
    async (payload: ThreadCreatePayload): Promise<IThreadResponse> => {
      try {
        if (!access.create) {
          throw new Error("You are not allowed to create a thread");
        }
        const res = await new Promise<IThreadResponse>((resolve, reject) => {
          emitEvent(
            CommentsEvents.THREAD_CREATE,
            {
              branch: branchId,
              objectId: objectId,
              objectType: objectType,
              content: payload.content,
              position: payload.position,
              commentablePath: payload.commentablePath || [],
            },
            (res: CallbackData<IThreadResponse>) => {
              if (res.error) {
                reject(res.error);
              } else {
                setThreads((prev) => ({
                  ...prev,
                  data:
                    params.sortOrder === SortOrder.DESC
                      ? [res.data, ...prev.data]
                      : [...prev.data, res.data],
                  cursor: { ...prev.cursor, total: prev.cursor.total + 1 },
                  totalComments: prev.totalComments + 1,
                }));
                setComments((prev) => ({
                  ...prev,
                  [res.data._id]: {
                    data: [res.data.comments?.[0]],
                    cursor: {
                      limit: 30,
                      total: 1,
                      skip: 0,
                    },
                  },
                }));

                resolve(res.data);
              }
            }
          );
        });
        return res;
      } catch (error) {
        message.handleError(error);
      }
    },
    [branchId, objectType, objectId, emitEvent, message, params, access.create]
  );

  const updateThread = useCallback(
    async (threadId: string, data: ThreadUpdatePayload): Promise<IThread> => {
      try {
        if (!access.update) {
          throw new Error("You are not allowed to update a thread");
        }
        const res = await new Promise<IThread>((resolve, reject) => {
          emitEvent(
            CommentsEvents.THREAD_UPDATE,
            threadId,
            data,
            (res: CallbackData<IThread>) => {
              setThreads((prev) => ({
                ...prev,
                data: prev.data
                  .map((t) => (t._id !== threadId ? t : { ...t, ...data }))
                  .filter((t) => t.status === ThreadStatus.ACTIVE),
                totalComments:
                  data.status === ThreadStatus.RESOLVED
                    ? prev.totalComments - res.data.totalComments
                    : prev.totalComments,
              }));
              if (res.error) {
                reject(res.error);
              } else {
                resolve(res.data);
              }
            }
          );
        });
        threadEvents.current.emit(CommentsEvents.THREAD_UPDATE, threadId, res);
        return res;
      } catch (error) {
        message.handleError(error);
      }
    },
    [emitEvent, message, access.update]
  );

  const deleteThread = useCallback(
    (threadId: string): Promise<string> => {
      if (!access.delete) {
        throw new Error("You are not allowed to delete a thread");
      }
      return new Promise((resolve) => {
        emitEvent(CommentsEvents.THREAD_DELETE, threadId, () => {
          resolve(threadId);
          threadEvents.current.emit(CommentsEvents.THREAD_DELETE, threadId);
          setThreads((prev) => ({
            ...prev,
            data: prev.data.filter((t) => t._id !== threadId),
            cursor: { ...prev.cursor, total: prev.cursor.total - 1 },
            totalComments:
              prev.totalComments -
              (prev.data.find((t) => t._id === threadId)?.totalComments || 0),
          }));
        });
      });
    },
    [emitEvent, access.delete]
  );

  const setSelectedThread = useCallback((thread: IThreadResponse): void => {
    selectThread(thread);
  }, []);

  const getThreadComments = async (threadId: string) => {
    if (!access.read) return;
    try {
      const threadComments = await getComments(workspaceId, projectId, {
        threadId,
      });
      setComments((prevComments) => ({
        ...prevComments,
        [threadId]: threadComments,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const addReply = useCallback(
    async (payload: CommentCreatePayload): Promise<IComment> => {
      try {
        if (!access.create) {
          throw new Error("You are not allowed to create a comment");
        }
        const res = await new Promise<IComment>((resolve, reject) => {
          emitEvent(
            CommentsEvents.COMMENT_CREATE,
            payload,
            (res: CallbackData<IComment>) => {
              if (res.error) {
                reject(res.error);
              } else {
                setThreads((prev) => ({
                  ...prev,
                  data: prev.data.map((i) => {
                    return i._id === res.data.thread
                      ? {
                          ...i,
                          totalComments: i.totalComments + 1,
                        }
                      : i;
                  }),
                  totalComments: prev.totalComments + 1,
                }));
                setComments((prev) => ({
                  ...prev,
                  [payload.thread]: prev[payload.thread]
                    ? {
                        ...prev[payload.thread],
                        data: [...prev[payload.thread].data, res.data],
                      }
                    : res.data,
                }));
                resolve(res.data);
              }
            }
          );
        });
        threadEvents.current.emit(CommentsEvents.COMMENT_CREATE, res);
        return res;
      } catch (error) {
        message.handleError(error);
      }
    },
    [emitEvent, message, access.create]
  );

  useEffect(() => {
    if (!access.read) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getThreads(workspaceId, projectId, {
          ...params,
          branchOnly: !params.objectId,
        });
        setThreads(res);
        for (const thread of res.data) {
          setComments((prevComments) => ({
            ...prevComments,
            [thread._id]: {
              data: thread.comments,
            },
          }));
        }
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    if (params.branchId || params.objectId) {
      fetchData();
    }
  }, [params, workspaceId, projectId, access.read]);

  useEffect(() => {
    if (!access.read) return;

    if (objectId) {
      setParams((prev) =>
        objectId === prev.objectId ? prev : { ...prev, objectId }
      );
    }
  }, [objectId, access.read]);

  useEffect(() => {
    if (!access.read) return;

    const onThreadCreate = (data: IThreadResponse) => {
      if (data.branch === branchId && data.objectId === objectId) {
        setThreads((prev) => ({
          ...prev,
          data:
            params.sortOrder === SortOrder.DESC
              ? [data, ...prev.data]
              : [...prev.data, data],
          totalComments: prev.totalComments + 1,
        }));
        setComments((prev) => ({
          ...prev,
          [data._id]: {
            data: [data.comments?.[0]],
          },
        }));
      }
    };

    const onAddReply = (data: any) => {
      if (data.branch === branchId && data.objectId === objectId) {
        setThreads((prev) => ({
          ...prev,
          totalComments: prev.totalComments + 1,
        }));
        setComments((prev) => ({
          ...prev,
          [data.thread]: {
            data: [...comments[data.thread].data, data],
          },
        }));
      }
    };

    const onThreadUpdate = ({
      _id,
      position,
      status,
      comments,
    }: IThreadResponse) => {
      setThreads((prev) => ({
        ...prev,
        data: prev.data
          .map((t) =>
            t._id !== _id
              ? t
              : {
                  ...t,
                  position,
                  status,
                  totalComments: t.totalComments + (comments?.length || 0),
                }
          )
          .filter((t) => t.status === ThreadStatus.ACTIVE),
        totalComments:
          status === ThreadStatus.ACTIVE
            ? prev.totalComments + (comments?.length || 0)
            : prev.totalComments -
              (prev.data.find((t) => t._id === _id)?.totalComments || 0),
      }));
      setComments((prevComments) => ({
        ...prevComments,
        [_id]: {
          data: comments
            ? prevComments[_id]?.data
              ? [...prevComments[_id].data, ...comments]
              : comments
            : [],
        },
      }));
    };

    const onThreadDelete = (threadId: string) => {
      setThreads((prev) => ({
        ...prev,
        data: prev.data.filter((t) => t._id !== threadId),
        totalComments:
          prev.totalComments -
          (prev.data.find((t) => t._id === threadId)?.totalComments || 0),
      }));
    };

    subscribe(CommentsEvents.THREAD_CREATE, onThreadCreate);
    subscribe(CommentsEvents.THREAD_UPDATE, onThreadUpdate);
    subscribe(CommentsEvents.THREAD_DELETE, onThreadDelete);
    subscribe(CommentsEvents.COMMENT_CREATE, onAddReply);
    return () => {
      unsubscribe(CommentsEvents.THREAD_CREATE, onThreadCreate);
      unsubscribe(CommentsEvents.THREAD_UPDATE, onThreadUpdate);
      unsubscribe(CommentsEvents.THREAD_DELETE, onThreadDelete);
      unsubscribe(CommentsEvents.COMMENT_CREATE, onAddReply);
    };
  }, [branchId, objectId, subscribe, unsubscribe, access.read]);

  // temporarily commented, causes platform list updating issue
  // while deleting last platform and creating one with the same name

  /* useEffect(() => {
    emitEvent(ContextLimitingEvents.BRANCH_SUBSCRIBE, branchId);
    return () => {
      debugger;
      emitEvent(ContextLimitingEvents.BRANCH_UNSUBSCRIBE, branchId);
    };
  }, [emitEvent, branchId]);*/

  const value = {
    threads,
    comments,
    selectedThread,
    params,
    loading,
    threadEvents: threadEvents.current,
    setParams,
    addReply,
    createThread,
    updateThread,
    deleteThread,
    getThreadComments,
    setSelectedThread,
  };

  return (
    <ThreadsContext.Provider value={value}>{children}</ThreadsContext.Provider>
  );
};

export const ThreadsContext = createContext<IThreadsContext | null>(null);

export function useThreads() {
  const context = useContext(ThreadsContext);
  if (context === null) {
    throw new Error("useThreads must be used within ThreadsProvider");
  }
  return context;
}

interface IThreadsContext {
  loading: boolean;
  params: IGetThreadsReqParams;
  threads: IListRes<IThreadResponse>;
  selectedThread: IThreadResponse;
  comments: {};
  threadEvents: EventEmitter;
  setParams: React.Dispatch<React.SetStateAction<IGetThreadsReqParams>>;
  createThread: (
    data: Partial<ThreadCreatePayload>
  ) => Promise<IThreadResponse>;
  deleteThread: (data: Partial<string>) => Promise<string>;
  setSelectedThread: (thread: IThreadResponse) => void;
  updateThread: (id: string, data: ThreadUpdatePayload) => Promise<IThread>;
  addReply: (data: CommentCreatePayload) => Promise<IComment>;
  getThreadComments: (threadId: string) => Promise<void>;
}
