import { Flex, BoxProps } from "@chakra-ui/react";
import {
  CommentCreatePayload,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
  ThreadCreatePayload,
} from "@multiplayer/types";
import CheckAccess from "shared/components/CheckAccess";

import ThreadInput from "shared/components/Thread/ThreadInput";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";

type ThreadFormProps = {
  onSubmit: (data: Partial<ThreadCreatePayload> | CommentCreatePayload) => void;
  threadId?: string;
  singleComment?: boolean;
  initiator?: any;
  parentId?: string;
  boxProps?: BoxProps;
};

const ThreadForm = ({
  onSubmit,
  threadId = null,
  singleComment = false,
  initiator = null,
  parentId,
  boxProps = {},
}: ThreadFormProps) => {
  const handleSubmit = (value: string, cb: Function) => {
    const trimmedVal = value.trim();
    if (!trimmedVal) return;
    if (threadId) {
      onSubmit({ content: trimmedVal, thread: threadId });
    } else {
      onSubmit({ content: trimmedVal, position: [0, 0] });
    }
    cb();
  };

  return (
    <CheckAccess
      entity={RoleProjectPermissionEntity.COMMENT}
      permission={RoleAccessAction.CREATE}
      scope={RoleType.PROJECT}
    >
      <Flex borderRadius="base" gap="2" zIndex={1} {...boxProps}>
        {initiator && (
          <WorkspaceUserAvatar size="xs" user={initiator} showTooltip={false} />
        )}
        <ThreadInput
          onSubmit={handleSubmit}
          parentId={parentId}
          placeholder={
            !initiator || !threadId
              ? "Write a new message"
              : singleComment
              ? "Reply to this message"
              : "Reply to this thread"
          }
        />
      </Flex>
    </CheckAccess>
  );
};

export default ThreadForm;
