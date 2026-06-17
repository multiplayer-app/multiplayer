import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Box, UseDisclosureReturn } from "@chakra-ui/react";
import {
  CommentCreatePayload,
  ThreadUpdatePayload,
  ThreadStatus,
  CommentsEvents,
} from "@multiplayer/types";

import { ThreadPopover } from "shared/components/Thread";
import { useThreads } from "shared/providers/ThreadsContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";

const threadStyle = { w: 0, h: 0 };

interface DocumentCommentsProps {
  editor: any;
  entityThreadsDisclosure?: UseDisclosureReturn;
}

const DocumentComments = ({
  editor,
  entityThreadsDisclosure,
}: DocumentCommentsProps) => {
  const commentsContainer = useRef<HTMLDivElement>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useWorkspace();
  const [activeInstance, setActiveInstance] = useState<any>(null);
  const { threads, loading, threadEvents, createThread, setSelectedThread } =
    useThreads();

  useEffect(() => {
    if (!loading && threads.data) {
      if (entityThreadsDisclosure) {
        const editorWrapper = document.getElementById("doc-editor-wrapper");

        editorWrapper?.addEventListener("click", handleClick);
        return () => {
          editorWrapper?.removeEventListener("click", handleClick);
        };
      }
    }
  }, [threads.data, loading, entityThreadsDisclosure]);

  const clearMarkById = useCallback(
    (id: string) => {
      editor.commands.unsetCommentById(id);
    },
    [editor]
  );

  const handleCreateThread = useCallback(
    async (payload: CommentCreatePayload) => {
      const thread = await createThread({
        content: payload.content,
        position: [0, 0],
      });
      if (thread) {
        editor.commands.updateCommentAttributes("new", {
          _id: thread._id,
          userId: user.data._id,
          color: user.data.color,
        });
      }
    },
    [createThread, editor, user.data]
  );

  const handleCloseThread = useCallback(() => {
    setActiveInstance(null);
  }, []);

  const checkCommentInstance = useCallback((editor: any) => {
    const newVal = editor.isActive("comment");
    if (newVal) {
      const { comment } = editor.getAttributes("comment");
      setActiveInstance(comment);
    } else {
      setActiveInstance(null);
    }
  }, []);

  const getThreadOffset = useCallback((id: string) => {
    const trigger = document.querySelector(
      `[data-comment="${id}"]`
    ) as HTMLSpanElement;
    if (!trigger) return null;
    return {
      y: trigger.offsetTop + trigger.offsetHeight,
      x: trigger.offsetLeft,
    };
  }, []);

  useEffect(() => {
    return () => {
      if (activeInstance?._id === "new") {
        clearMarkById("new");
      }
    };
  }, [activeInstance, clearMarkById]);

  // Add local listeners for local events
  useEffect(() => {
    const onUpdate = (threadId: string, payload: ThreadUpdatePayload) => {
      if (payload.status === ThreadStatus.RESOLVED) {
        clearMarkById(threadId);
      }
    };
    const onDelete = (threadId: string) => clearMarkById(threadId);

    threadEvents.on(CommentsEvents.THREAD_UPDATE, onUpdate);
    threadEvents.on(CommentsEvents.THREAD_DELETE, onDelete);
    return () => {
      threadEvents.off(CommentsEvents.THREAD_UPDATE, onUpdate);
      threadEvents.off(CommentsEvents.THREAD_DELETE, onDelete);
    };
  }, [clearMarkById, threadEvents]);

  useEffect(() => {
    const onOnUpdate = ({ editor }) => {
      checkCommentInstance(editor);
    };
    editor.on("update", onOnUpdate);
    return () => {
      editor.off("update", onOnUpdate);
    };
  }, [editor, checkCommentInstance]);

  useEffect(() => {
    if (state?.thread) {
      const trigger = document.querySelector(
        `[data-comment="${state.thread._id}"]`
      );
      if (trigger) {
        trigger.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
      navigate("", { state: null });
    }
  }, [editor, state, navigate]);

  const handleClick = (event: MouseEvent) => {
    const dataCommentValue = (event.target as HTMLSpanElement).dataset.comment;
    if (!dataCommentValue) {
      return;
    }

    const clickedThread = threads.data.find(
      (thread) => thread._id === dataCommentValue
    );

    if (clickedThread) {
      if (!entityThreadsDisclosure.isOpen) {
        entityThreadsDisclosure.onOpen();
      }
      setSelectedThread(clickedThread);
    }
  };

  const newThreadBox = useMemo(() => {
    if (
      !activeInstance ||
      activeInstance._id !== "new" ||
      activeInstance.userId !== user.data._id
    )
      return null;
    const { x, y } = getThreadOffset("new");

    return (
      <ThreadPopover
        x={x}
        y={y}
        defaultIsOpen={true}
        popoverTrigger={false}
        initiator={user.data._id}
        placement="bottom-start"
        triggerProps={threadStyle}
        hideThreadAvatars={true}
        onClose={handleCloseThread}
        onSubmit={handleCreateThread}
      ></ThreadPopover>
    );
  }, [
    user.data,
    activeInstance,
    getThreadOffset,
    handleCloseThread,
    handleCreateThread,
  ]);

  return (
    <Box
      position="relative"
      ref={commentsContainer}
      className="comments-container"
    >
      {newThreadBox}
    </Box>
  );
};

export default DocumentComments;
