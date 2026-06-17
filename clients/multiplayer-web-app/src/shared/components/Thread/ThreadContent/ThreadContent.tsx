import { Flex, Box, Icon, Text, Tooltip, IconButton } from "@chakra-ui/react";
import { ArchiveIcon, CheckCircleIcon, CloseIcon } from "shared/icons";
import {
  RoleType,
  RoleAccessAction,
  ThreadStatus,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";

import ThreadForm from "../ThreadForm";
import ThreadComments from "../ThreadComments";
import CheckAccess from "shared/components/CheckAccess";

type ThreadContentProps = {
  onClose?: (id?: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, ThreadUpdatePayload) => void;
  onSubmit: (arg: { content: string; threadId?: string }) => void;
  threadId: string;
  initiator: string;
};

const ThreadContent = ({
  onClose,
  onDelete,
  onUpdate,
  onSubmit,
  threadId,
  initiator,
}: ThreadContentProps) => {
  return (
    <>
      <Flex
        px="4"
        gap="1"
        h="50px"
        color="muted"
        alignItems="center"
        fontWeight="medium"
      >
        <Text fontSize="lg" mr="auto">
          Thread
        </Text>
        {threadId && (
          <>
            <CheckAccess
              entity={RoleProjectPermissionEntity.COMMENT}
              permission={RoleAccessAction.DELETE}
              scope={RoleType.PROJECT}
            >
              <Tooltip label="Archive">
                <IconButton
                  size="sm"
                  variant="baser"
                  aria-label="archive"
                  icon={<Icon as={ArchiveIcon} />}
                  onClick={() => onDelete(threadId)}
                />
              </Tooltip>
            </CheckAccess>
            <CheckAccess
              entity={RoleProjectPermissionEntity.COMMENT}
              permission={RoleAccessAction.UPDATE}
              scope={RoleType.PROJECT}
            >
              <Tooltip label="Mark as resolved">
                <IconButton
                  size="sm"
                  variant="baser"
                  aria-label="resolve"
                  icon={<Icon as={CheckCircleIcon} />}
                  onClick={() =>
                    onUpdate(threadId, { status: ThreadStatus.RESOLVED })
                  }
                />
              </Tooltip>
            </CheckAccess>
          </>
        )}
        {onClose && (
          <Tooltip label="Close">
            <IconButton
              size="sm"
              variant="baser"
              aria-label="resolve"
              icon={<Icon as={CloseIcon} />}
              onClick={() => onClose(threadId)}
            />
          </Tooltip>
        )}
      </Flex>
      <Box flex="1" px="4" overflow="auto" minH="0">
        {threadId && <ThreadComments threadId={threadId} />}
      </Box>
      <ThreadForm
        threadId={threadId}
        initiator={initiator}
        onSubmit={onSubmit}
        boxProps={{ p: "4" }}
      />
    </>
  );
};

export default ThreadContent;
