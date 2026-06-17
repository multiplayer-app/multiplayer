import { Box, Button } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { editor } from "monaco-editor";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { Thread } from "shared/components/Thread";
import { useThreads } from "shared/providers/ThreadsContext";
import { CommentCreatePayload, ThreadUpdatePayload } from "@multiplayer/types";

interface CodeEditorCommentsProps {
  editor: editor.IStandaloneCodeEditor;
  monaco: any;
}

const CodeEditorComments = ({ editor, monaco }: CodeEditorCommentsProps) => {
  const dataRef = useRef({ isActionAdded: false });
  const threadZoneRef = useRef<Map<string, string>>(new Map());
  const [zones, setZones] = useState(new Map());
  const { user } = useWorkspace();
  const {
    threads,
    loading,
    threadEvents,
    createThread,
    updateThread,
    deleteThread,
    addReply,
  } = useThreads();

  const handleRemoveZone = (zoneId) => {
    editor.changeViewZones((changeAccessor) => {
      changeAccessor.removeZone(zoneId);
      setZones((prev) => {
        const newState = new Map(prev);
        newState.delete(zoneId);
        return newState;
      });
    });
  };

  const handleCreateThread = async (
    zoneId: string,
    position: number[],
    content: string
  ) => {
    await createThread({ content, position });
    handleRemoveZone(zoneId);
  };

  const handleDeleteThread = (zoneId: string) => (threadId: string) => {
    deleteThread(threadId);
  };

  const handleAddReply = (payload: CommentCreatePayload) => {
    addReply(payload);
  };

  const handleUpdateThread =
    (zoneId: string) => (threadId: string, payload: ThreadUpdatePayload) => {
      updateThread(threadId, payload);
    };

  const handleSubmit =
    (zoneId: string, lineNumber: number) => (payload: CommentCreatePayload) => {
      if (payload.thread) {
        handleAddReply(payload);
      } else {
        const position = [lineNumber, 0, lineNumber, 0];
        handleCreateThread(zoneId, position, payload.content);
      }
    };

  const renderThreadComponent = (
    lineNumber: number,
    initiator: string,
    threadId?: string
  ) => {
    const widgetDomNode = document.createElement("div");
    widgetDomNode.classList.add("mp-comment-node");

    editor.changeViewZones((changeAccessor) => {
      const zone = {
        heightInPx: 338,
        domNode: widgetDomNode,
        afterLineNumber: lineNumber,
        suppressMouseDown: false,
      };
      const zoneId = changeAccessor.addZone(zone);
      if (threadId) {
        threadZoneRef.current.set(threadId, zoneId);
      }

      setZones((prev) => {
        const newState = new Map(prev);
        newState.set(
          zoneId,
          createPortal(
            <CustomComponent
              zoneId={zoneId}
              threadId={threadId}
              initiator={initiator}
              onClose={handleRemoveZone}
              onUpdate={handleUpdateThread(zoneId)}
              onDelete={handleDeleteThread(zoneId)}
              onSubmit={handleSubmit(zoneId, lineNumber)}
            />,
            widgetDomNode
          )
        );
        return newState;
      });
    });
  };

  useEffect(() => {
    const threadsMap = new Map(threads.data.map((t) => [t._id, t]));

    threads.data.forEach((thread) => {
      const [lineNumber] = thread.position;
      if (!threadZoneRef.current.has(thread._id)) {
        renderThreadComponent(lineNumber, thread.initiator, thread._id);
      }
    });

    // cleanup zones for removed threads
    Array.from(threadZoneRef.current.keys()).forEach((threadId) => {
      if (!threadsMap.has(threadId)) {
        const zoneId = threadZoneRef.current.get(threadId);
        handleRemoveZone(zoneId);
      }
    });
  }, [threads.data]);

  useEffect(() => {
    if (!dataRef.current.isActionAdded) {
      dataRef.current.isActionAdded = true;
      editor.addAction({
        id: "mp-add-comment",
        label: "Add a Comment",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10],
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.5,
        run: function (ed) {
          const position = ed.getPosition();
          if (position) {
            renderThreadComponent(position.lineNumber, user.data._id);
          }
        },
      });
    }
  }, [editor, monaco]);

  return <>{Array.from(zones.values()).map((n) => n)}</>;
};

const CustomComponent = ({
  zoneId,
  threadId,
  onSubmit,
  onUpdate,
  onDelete,
  initiator,
  onClose,
}) => {
  const handClose = (e) => {
    onClose(zoneId);
  };

  return (
    <Box
      py="2"
      px="1"
      pr="20"
      h="full"
      position="relative"
      userSelect="initial"
      onScroll={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Thread
        initiator={initiator}
        threadId={threadId}
        onSubmit={onSubmit}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onClose={!threadId && handClose}
      />
    </Box>
  );
};

export default CodeEditorComments;
