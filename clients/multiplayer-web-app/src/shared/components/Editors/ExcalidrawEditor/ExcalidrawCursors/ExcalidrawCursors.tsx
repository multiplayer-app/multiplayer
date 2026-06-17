import { Box } from "@chakra-ui/react";
import { Collaborator } from "@excalidraw/excalidraw/types/types";
import { useCallback, useEffect, useRef, useState } from "react";
import CollaborativeCursors from "shared/components/CollaborativeCursors";
import { getClientUserName } from "shared/helpers/general.helpers";
import { useExcalidraw } from "shared/providers/ExcalidrawContext";

interface ExcalidrawCursorsProps {}

const ExcalidrawCursors = (props: ExcalidrawCursorsProps) => {
  const containerRef = useRef<HTMLDivElement>();
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(
    new Map()
  );
  const { provider, editor } = useExcalidraw();

  const onAwarenessChange = useCallback(
    (_, origin: string): void => {
      if (origin === "local") return;
      const { awareness } = provider;
      const states = awareness.getStates();
      const collaborators = new Map<string, Collaborator>();

      states.forEach((state, key: number) => {
        if (state && state.user && state.pointer && state.focused) {
          const { user, pointer, laser } = state;
          collaborators.set(user._id, {
            id: user._id,
            username: getClientUserName(user),
            color: {
              background: user.color,
              stroke: "inverse",
            },
            ...pointer,
            ...laser,
          });
        }
      });

      setCollaborators(collaborators);
    },
    [provider]
  );

  useEffect(() => {
    if (!provider || !editor) return;
    provider.awareness.on("change", onAwarenessChange);
    const container = containerRef.current.parentElement;
    const onMouseEnter = () => {
      provider.awareness.setLocalStateField("focused", true);
    };
    const onMouseLeave = () => {
      provider.awareness.setLocalStateField("focused", false);
    };

    container.addEventListener("pointerleave", onMouseLeave);
    container.addEventListener("pointerenter", onMouseEnter);
    return () => {
      container.removeEventListener("pointerleave", onMouseLeave);
      container.removeEventListener("pointerenter", onMouseEnter);
    };
  }, [provider, editor]);

  if (!editor) return null;

  const state = editor.getAppState();
  const x = state.scrollX * state.zoom.value;
  const y = state.scrollY * state.zoom.value;

  return (
    <Box
      ref={containerRef}
      zIndex={3}
      position="relative"
      pointerEvents="none"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <CollaborativeCursors
        zoom={state.zoom.value}
        cursors={Array.from(collaborators.values())}
      />
    </Box>
  );
};

export default ExcalidrawCursors;
