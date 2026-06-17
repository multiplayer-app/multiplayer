import { Box, Flex, Tab, TabPanel } from "@chakra-ui/react";
import {
  ThreadCreatePayload,
  CommentCreatePayload,
  SortOrder,
} from "@multiplayer/types";
import ThreadActionsRow from "shared/components/Thread/ThreadActionsRow";
import ThreadForm from "shared/components/Thread/ThreadForm";
import Threads from "shared/components/Threads";
import { useThreads } from "shared/providers/ThreadsContext";

export const CommentsTab = () => {
  const { threads } = useThreads();
  return (
    <Tab key="comments">
      Comments
      <Flex
        px="1"
        ml="2"
        fontSize="xs"
        bg="bg.subtle"
        color="muted"
        border="1px solid"
        borderRadius="base"
        borderColor="blackAlpha.100"
      >
        {threads.totalComments}
      </Flex>
    </Tab>
  );
};

export const CommentsTabPanel = () => {
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
    <TabPanel
      key="comments"
      p="0"
      h="full"
      flex="1"
      minH="0"
      as={Flex}
      direction="column"
    >
      <ThreadActionsRow />
      <Threads />
      <Box borderTop="1px solid" borderTopColor="border.primary" p={4}>
        <ThreadForm onSubmit={onTreadCreate} parentId="push-drawer" />
      </Box>
    </TabPanel>
  );
};
