import { Box, Flex } from "@chakra-ui/react";
import {
  ThreadCreatePayload,
  CommentCreatePayload,
  SortOrder,
} from "@multiplayer/types";
import ThreadActionsRow from "shared/components/Thread/ThreadActionsRow";
import ThreadForm from "shared/components/Thread/ThreadForm";
import Threads from "shared/components/Threads";
import { useThreads } from "shared/providers/ThreadsContext";

interface SessionCommentsProps {}

const SessionComments = (props: SessionCommentsProps) => {
  const { createThread, params } = useThreads();
  const onTreadCreate = async (
    data: Partial<ThreadCreatePayload> | CommentCreatePayload
  ) => {
    await createThread(data);
    if (params.sortOrder === SortOrder.ASC) {
      setTimeout(() => {
        const threadItems = document.getElementsByClassName("thread-item");
        if (threadItems?.length) {
          threadItems[threadItems.length - 1].scrollIntoView();
        }
      });
    }
  };

  return (
    <Flex direction="column" h="full" id="session-comments">
      <ThreadActionsRow />
      <Threads />
      <Box borderTop="1px solid" borderTopColor="border.primary" p={4}>
        <ThreadForm onSubmit={onTreadCreate} parentId="session-comments" />
      </Box>
    </Flex>
  );
};

export default SessionComments;
