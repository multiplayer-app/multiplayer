import { Text, Flex, Badge, Box } from "@chakra-ui/react";
import {
  CommentCreatePayload,
  EntityType,
  SortOrder,
  ThreadCreatePayload,
} from "@multiplayer/types";

import Threads from "shared/components/Threads";
import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";
import ThreadForm from "shared/components/Thread/ThreadForm";

import EntityIcon from "shared/components/EntityIcon";
import ThreadActionsRow from "shared/components/Thread/ThreadActionsRow";
import { useThreads } from "shared/providers/ThreadsContext";
import { entityDetails } from "shared/configs/project.configs";

interface EntityThreadsDrawerProps {
  onClose: () => void;
  entityType: EntityType;
}

const EntityThreadsDrawer = ({
  onClose,
  entityType,
}: EntityThreadsDrawerProps) => {
  const { threads, createThread, params } = useThreads();

  const onCreate = async (
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
    <Drawer isOpen={!!threads}>
      <DrawerContent height="auto" onClose={onClose}>
        <Box
          p="4"
          borderBottom="1px solid"
          borderBottomColor="border.primary"
          position="relative"
        >
          <Flex alignItems="center" mb={2}>
            <Text fontSize="md" fontWeight="medium" mr="2">
              Comments
            </Text>
            <Badge
              variant="outline"
              color="muted"
              fontWeight="medium"
              backgroundColor="bg.subtle"
              border="solid 1px"
              borderColor="border.primary"
              boxShadow="unset"
            >
              {threads.totalComments}
            </Badge>
          </Flex>
          <Flex alignItems="center">
            <EntityIcon color="muted" boxSize="4" name={entityType} mr={1} />
            <Text fontSize="xs" color="muted">
              {entityDetails[entityType].title}{" "}
            </Text>
          </Flex>
        </Box>
        <ThreadActionsRow />
        <Threads />
        <Box borderTop="1px solid" borderTopColor="border.primary" p={4}>
          <ThreadForm onSubmit={onCreate} parentId="push-drawer" />
        </Box>
      </DrawerContent>
    </Drawer>
  );
};

export default EntityThreadsDrawer;
