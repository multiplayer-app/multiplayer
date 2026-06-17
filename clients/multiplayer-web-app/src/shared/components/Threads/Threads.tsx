import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  CommentCreatePayload,
  IComment,
  IThreadResponse,
  IWorkspaceUser,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
  ThreadStatus,
  ThreadUpdatePayload,
} from "@multiplayer/types";
import TimeAgo from "shared/components/TimeAgo";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import EmptyComments from "assets/images/emptyStates/comments-empty-list.png";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";
import MentionedText from "shared/components/MentionedText";

import { CheckCircleIcon, MoreIcon } from "shared/icons";
import { useThreads } from "shared/providers/ThreadsContext";
import { getClientUserName } from "shared/helpers/general.helpers";
import {
  useWorkspace,
  useWorkspaceUsers,
} from "shared/providers/WorkspaceContext";
import ThreadForm from "../Thread/ThreadForm";
import EmptyScreen from "../EmptyScreen";
import PageLoading from "../PageLoading";
import classNames from "classnames";
import "./Threads.scss";
import CheckAccess from "../CheckAccess";

const Threads = () => {
  const {
    threads,
    comments,
    loading,
    params,
    selectedThread,
    setParams,
    updateThread,
    deleteThread,
    addReply,
    getThreadComments,
    setSelectedThread,
  } = useThreads();
  const { user } = useWorkspace();

  useEffect(() => {
    if (
      selectedThread &&
      threads.data.find((i) => i._id === selectedThread._id)
    ) {
      const thread = document.getElementById(selectedThread._id);
      thread.scrollIntoView({ behavior: "smooth", block: "start" });
      setSelectedThread(null);
    }
  }, [selectedThread]);

  const handleScrollEnd = () => {
    if (loading || params.skip + params.limit > threads.cursor.total) return;
    setParams(({ skip, ...prev }) => ({ ...prev, skip: skip + prev.limit }));
  };

  const onThreadClick = (t: IThreadResponse) => {
    setSelectedThread(null);
    // if (t.entity) {
    //   onEntityOpen(t.entity as IEntity, { thread: t });
    // }
  };

  const handleDeleteComment = useCallback(
    async (threadId: string) => {
      await deleteThread(threadId);
    },
    [deleteThread]
  );

  if (loading) {
    return <PageLoading my="4" position="relative" height="100%" />;
  }

  if (!threads?.data?.length) {
    return (
      <EmptyScreen
        title="Kickstart the conversation!"
        description="There are currently no comments for you here."
        overflow="auto"
        icon={
          <Flex mb="2">
            <Image w="180px" src={EmptyComments} />
          </Flex>
        }
      ></EmptyScreen>
    );
  }

  return (
    <InfiniteScrollBox
      flex="1"
      p="4"
      overflow="auto"
      position="relative"
      isLoading={loading}
      id="threads-list"
      onScrollEnd={handleScrollEnd}
    >
      {threads.data.map(
        (thread) =>
          comments[thread._id]?.data && (
            <ThreadItem
              data={thread}
              key={thread._id}
              id={thread._id}
              isHighlighted={selectedThread?._id === thread._id}
              user={user?.data}
              comments={comments[thread._id]?.data}
              onClick={onThreadClick}
              onUpdate={updateThread}
              onSubmit={addReply}
              onLoadMore={getThreadComments}
              onDelete={handleDeleteComment}
            />
          )
      )}
    </InfiniteScrollBox>
  );
};

const ThreadItem = ({
  data,
  id,
  isHighlighted,
  comments,
  user,
  onClick,
  onSubmit,
  onUpdate,
  onDelete,
  onLoadMore,
}: {
  isHighlighted: boolean;
  id: string;
  data: IThreadResponse;
  comments: IComment[];
  user: IWorkspaceUser;
  onClick: (t: IThreadResponse) => void;
  onSubmit: (payload: CommentCreatePayload) => void;
  onUpdate: (threadId: string, payload: ThreadUpdatePayload) => void;
  onDelete: (threadId: string) => void;
  onLoadMore: (threadId: string) => void;
}) => {
  const [showAllComments, setShowAllComments] = useState(false);
  const workspaceUsers = useWorkspaceUsers();

  const onThreadItemClick = () => {
    onClick(data);
  };

  const showMoreComments = (e) => {
    e.stopPropagation();
    onLoadMore(data._id);
    setShowAllComments(true);
  };

  return (
    <Flex
      p="4"
      mb="4"
      fontSize="sm"
      cursor="pointer"
      flexDir="column"
      borderRadius={8}
      border="solid 1px"
      id={id}
      className={classNames("thread-item", {
        "has-replies": comments?.length > 1,
        "is-highlighted": isHighlighted,
      })}
      borderColor="border.primary"
      onClick={onThreadItemClick}
      role="group"
    >
      {comments?.map((comment: IComment, index: number) => {
        const initiator =
          workspaceUsers[comment.workspaceUser["_id"] || comment.workspaceUser];
        const fullName = initiator ? getClientUserName(initiator) : "";

        return (
          <Box key={comment._id} pl={index === 0 ? 0 : 8} mb={4}>
            <Flex justifyContent="space-between">
              <Flex mb={1} alignItems="center">
                <WorkspaceUserAvatar
                  mr={2}
                  size="xs"
                  userSelect="none"
                  user={comment.workspaceUser}
                />
                <Text fontSize="xs" fontWeight="medium" mr={1}>
                  {fullName}
                </Text>
                <Text fontSize="xs" color="muted" whiteSpace="nowrap">
                  <TimeAgo date={comment.createdAt} />
                </Text>
              </Flex>
              {index === 0 && (
                <CheckAccess
                  entity={RoleProjectPermissionEntity.COMMENT}
                  permission={RoleAccessAction.UPDATE}
                  scope={RoleType.PROJECT}
                >
                  <Flex alignItems="center" ml={2} zIndex={2}>
                    <Tooltip label="Mark as resolved">
                      <IconButton
                        size="sm"
                        variant="baser"
                        aria-label="resolve"
                        icon={<Icon as={CheckCircleIcon} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate(data._id, {
                            status: ThreadStatus.RESOLVED,
                          });
                        }}
                      />
                    </Tooltip>
                    <CheckAccess
                      entity={RoleProjectPermissionEntity.COMMENT}
                      permission={RoleAccessAction.DELETE}
                      scope={RoleType.PROJECT}
                    >
                      <Box onClick={(e) => e.stopPropagation()}>
                        <Menu isLazy placement="bottom-end" size="sm">
                          <MenuButton>
                            <Icon as={MoreIcon} />
                          </MenuButton>
                          <MenuList minWidth="unset">
                            <MenuItem onClick={() => onDelete(data._id)}>
                              Delete
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Box>
                    </CheckAccess>
                  </Flex>
                </CheckAccess>
              )}
            </Flex>
            <Text whiteSpace="pre-wrap" fontSize="xs" color="muted" pl={8}>
              <MentionedText content={comment.content} />
            </Text>
            {index === 0 &&
              comments.length < data.totalComments &&
              !showAllComments && (
                <Text
                  onClick={showMoreComments}
                  fontSize="xs"
                  fontWeight="medium"
                  color="#473CFB"
                  cursor="pointer"
                  pt={4}
                  px={8}
                >
                  Load more replies
                </Text>
              )}
          </Box>
        );
      })}
      <ThreadForm
        threadId={data._id}
        onSubmit={onSubmit}
        singleComment={data.usersInDiscussion?.length === 1}
        initiator={user._id}
        parentId="threads-list"
      />
    </Flex>
  );
};

export default Threads;
