import { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@chakra-ui/react";
import { CommentCreatePayload, IThreadResponse } from "@multiplayer/types";
import { AppState, PointerDownState } from "@excalidraw/excalidraw/types/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

import { useExcalidraw } from "shared/providers/ExcalidrawContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useThreads } from "shared/providers/ThreadsContext";
import { ThreadPopover } from "shared/components/Thread";

const ExcalidrawComments = ({ commentMode }) => {
  const { editor } = useExcalidraw();
  const { user } = useWorkspace();
  const [bounds, setBounds] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const { threads, createThread, updateThread, deleteThread, addReply } =
    useThreads();
  const [openedThread, setOpenedThread] = useState(null);
  const [newThread, setNewThread] = useState(null);
  const [zoom, setZoom] = useState(1);
  const state = editor?.getAppState();
  const commentModeRef = useRef(commentMode);
  const containerRef = useRef<HTMLDivElement>();

  useEffect(() => {
    commentModeRef.current = commentMode;
  }, [commentMode]);

  const updateBounds = useCallback(() => {
    if (editor) {
      const { x, y, width, height, zoom } = getVisibleBounds() || {};
      setBounds((prev) => {
        const newX = x * zoom * -1;
        const newY = y * zoom * -1;
        if (newX === prev.x && newY === prev.y) return prev;
        return {
          x: newX,
          y: newY,
          w: width,
          h: height,
        };
      });
    }
  }, [editor]);

  const getVisibleBounds = () => {
    if (editor) {
      const { zoom, width, height, scrollX, scrollY } = editor.getAppState();

      return {
        x: -scrollX,
        y: -scrollY,
        width: width / (zoom.value || 1),
        height: height / (zoom.value || 1),
        zoom: zoom.value || 1,
      };
    }
  };

  const handleChange = useCallback(
    (_: ExcalidrawElement[], appState: AppState) => {
      if (!appState) {
        return;
      }
      if (zoom !== appState.zoom.value) {
        updateBounds();
      }
      setZoom(appState.zoom.value);
    },
    [zoom]
  );

  const handlePointerUp = useCallback(
    (_: AppState["activeTool"], pointerDownState: PointerDownState) => {
      if (editor && commentModeRef.current) {
        setNewThread({
          x: pointerDownState.origin.x,
          y: pointerDownState.origin.y,
        });
      }
    },
    [editor]
  );

  useEffect(() => {
    const container = containerRef.current.parentElement;
    container?.addEventListener("pointermove", updateBounds);
    if (editor) {
      editor.onPointerDown(updateBounds);
      editor.onPointerUp(handlePointerUp);
      editor.onChange(handleChange);
    }
    return () => {
      container.removeEventListener("pointermove", updateBounds);
    };
  }, [editor, handlePointerUp, handleChange, updateBounds, commentMode]);

  const handleCreateThread = async (payload: CommentCreatePayload) => {
    const thread = await createThread({
      content: payload.content,
      position: [newThread.x, newThread.y],
    });
    if (thread) {
      setOpenedThread(thread._id);
      setNewThread(null);
    }
  };

  const handleCloseThread = (id: string) => {
    if (id) {
      setOpenedThread((prev) => (prev === id ? null : prev));
    } else {
      setNewThread(null);
    }
  };

  return (
    <Box
      top="0"
      left="0"
      ref={containerRef}
      zIndex={2}
      position="absolute"
      transformOrigin="0 0"
      style={{
        transform: `translate(${bounds.x}px, ${bounds.y}px)`,
      }}
    >
      {newThread && (
        <ThreadPopover
          x={newThread.x}
          y={newThread.y}
          defaultIsOpen={true}
          initiator={user.data._id}
          zoomLevel={state?.zoom?.value}
          onClose={handleCloseThread}
          onSubmit={handleCreateThread}
        />
      )}
      {threads.data.map((thread: IThreadResponse) => (
        <ThreadPopover
          key={thread._id}
          closeOnBlur={true}
          threadId={thread._id}
          x={thread.position[0]}
          y={thread.position[1]}
          status={thread.status}
          initiator={thread.initiator}
          zoomLevel={state?.zoom?.value}
          defaultIsOpen={thread._id === openedThread}
          onUpdate={updateThread}
          onClose={handleCloseThread}
          onSubmit={addReply}
          onDelete={deleteThread}
        />
      ))}
    </Box>
  );
};

export default ExcalidrawComments;
