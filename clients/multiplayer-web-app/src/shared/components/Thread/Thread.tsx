import { Flex } from "@chakra-ui/react";
import { CommentCreatePayload, ThreadUpdatePayload } from "@multiplayer/types";

import ThreadContent from "./ThreadContent/ThreadContent";

interface ThreadProps {
  threadId?: string;
  initiator: string;
  onClose?: (threadId: string) => void;
  onDelete?: (threadId: string) => void;
  onSubmit?: (arg: CommentCreatePayload) => void;
  onUpdate?: (threadId: string, payload: ThreadUpdatePayload) => void;
}

const Thread = ({
  threadId,
  initiator,
  onClose,
  onDelete,
  onSubmit,
  onUpdate,
}: ThreadProps) => {
  return (
    <Flex
      w="full"
      h="full"
      bg="bg.primary"
      zIndex="2222"
      flexDir="column"
      boxShadow="base"
      borderRadius="2xl"
    >
      <ThreadContent
        threadId={threadId}
        initiator={initiator}
        onClose={onClose}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onSubmit={onSubmit}
      />
    </Flex>
  );
};

export default Thread;
