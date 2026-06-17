import { Box, Flex, Text } from "@chakra-ui/react";
import {
  IComment,
  CommentsEvents,
  ContextLimitingEvents,
  RoleAccessAction,
  RoleType,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import { useParams } from "react-router-dom";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import { useSocket } from "shared/providers/SocketContext";
import { useThreads } from "shared/providers/ThreadsContext";
import { getComments } from "shared/services/thread.service";
import { useWorkspaceUsers } from "shared/providers/WorkspaceContext";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";
import { IGetCommentsReqParams, IListRes } from "shared/models/interfaces";

import TimeAgo from "shared/components/TimeAgo";
import { usePermissions } from "shared/providers/PermissionsContext";

const ThreadComments = ({ threadId }: { threadId: string }) => {
  const lastEl = useRef<HTMLDivElement>();
  const containerRef = useRef<HTMLDivElement>();
  const { subscribe, emitEvent, unsubscribe } = useSocket();
  const { workspaceId, projectId } = useParams();
  const { threadEvents } = useThreads();
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<IGetCommentsReqParams>({
    threadId,
    skip: null,
    limit: 100,
  });

  const [comments, setComments] = useState<IListRes<IComment>>({
    data: [],
    cursor: { skip: 0, limit: 0, total: 0 },
  });
  const { hasAccess } = usePermissions();
  const canReadComment = useMemo(
    () =>
      hasAccess(
        RoleProjectPermissionEntity.COMMENT,
        RoleAccessAction.READ,
        RoleType.PROJECT
      ),
    [hasAccess]
  );

  const handleScrollEnd = () => {
    if (loading || params.skip + params.limit > comments.cursor.total) {
      return;
    }
    setParams((prevParams) => ({
      ...prevParams,
      skip: prevParams.skip + prevParams.limit,
    }));
  };

  useEffect(() => {
    if (!canReadComment) return;
    const fetchData = async () => {
      setLoading(true);
      const res = await getComments(workspaceId, projectId, params);
      setComments(res);
      setLoading(false);
    };
    fetchData();
  }, [workspaceId, projectId, params, canReadComment]);

  useEffect(() => {
    if (!canReadComment) return;
    const onAddReply = (res: IComment) => {
      setComments((prev) => ({ ...prev, data: [...prev.data, res] }));
    };
    subscribe(CommentsEvents.COMMENT_CREATE, onAddReply);
    return () => {
      unsubscribe(CommentsEvents.COMMENT_CREATE, onAddReply);
    };
  }, [subscribe, unsubscribe, canReadComment]);

  useEffect(() => {
    if (!canReadComment) return;
    const onAddReplyLocal = (res: IComment) => {
      if (res.thread !== threadId) return;
      setComments((prev) => ({ ...prev, data: [...prev.data, res] }));
    };
    threadEvents.on(CommentsEvents.COMMENT_CREATE, onAddReplyLocal);
    return () => {
      threadEvents.off(CommentsEvents.COMMENT_CREATE, onAddReplyLocal);
    };
  }, [threadEvents, threadId, canReadComment]);

  useEffect(() => {
    if (!canReadComment) return;
    emitEvent(ContextLimitingEvents.THREAD_SUBSCRIBE, threadId);
    return () => {
      emitEvent(ContextLimitingEvents.THREAD_UNSUBSCRIBE, threadId);
    };
  }, [emitEvent, threadId]);

  useEffect(() => {
    containerRef.current.scrollTop = lastEl.current.offsetTop;
  }, [comments.data]);

  const handleChildScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop === 0 && e.deltaY < 0) {
      return;
    }
    if (scrollHeight - clientHeight <= scrollTop && e.deltaY > 0) {
      return;
    }
    // Prevent the scroll event from propagating to the parent.
    e.stopPropagation();
  };

  return (
    <Box
      minH="12"
      maxH="200px"
      overflowY="auto"
      ref={containerRef}
      onWheel={handleChildScroll}
    >
      {comments.data.map((c) => (
        <CommentItem key={c._id} data={c} />
      ))}
      <Box ref={lastEl} />
    </Box>
  );
};

const CommentItem = memo(({ data }: { data: IComment }) => {
  const workspaceUsers = useWorkspaceUsers();
  const user =
    typeof data.workspaceUser === "string"
      ? workspaceUsers[data.workspaceUser]
      : data.workspaceUser;
  const fullName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

  return (
    <Flex gap="2" mb="4">
      <WorkspaceUserAvatar size="xs" user={user} showTooltip={false} />
      <Box flex="1" minW="0">
        <Flex gap="2" whiteSpace="nowrap" lineHeight="6">
          <Text minW="0" overflow="hidden" textOverflow="ellipsis">
            {fullName}
          </Text>
          <Text color="muted">
            <TimeAgo date={data.createdAt}></TimeAgo>
          </Text>
        </Flex>
        <Text mt="1">{data.content}</Text>
      </Box>
    </Flex>
  );
});

export default ThreadComments;
