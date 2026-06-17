import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useMemo,
} from "react";
import { Replayer } from "rrweb";
import debounce from "lodash.debounce";
import { ISessionNoteItem, SessionNoteType } from "@multiplayer/types";
import { ElementPath } from "./ElementInspector";
import {
  SketchState,
  useSketchControl,
  SketchControlAPI,
} from "../hooks/useSketchControl";
import { useDebugSessionNotes } from "../../../DebugSessionNotesContext";
import { v4 as uuidv4 } from "uuid";
import { formatTime } from "../../../utils";
import { normalizeTimestamp } from "../utils/normalizeTimestamp";

import { clone } from "shared/utils";
import { useElementInspectorAvailable } from "shared/components/AgentChat";

export enum ReplayerOverlayTool {
  Inspector = "inspector",
  Sketch = "sketch",
}

interface IReplayerOverlayContext {
  tool: ReplayerOverlayTool | null;
  replayer: Replayer;
  disabled: boolean;
  sketchState: SketchState;
  sketchControl: SketchControlAPI;
  currentTime: number;
  currentPage: number;
  currentTimeNotes: ISessionNoteItem[];
  currentPageNote: ISessionNoteItem | null;
  setSketchAPI: (api: any) => void;
  onSketchChange: (elements: any[]) => void;
  onElementSelect: (path: ElementPath[]) => void;
  onToolChange: (tool: ReplayerOverlayTool | null) => void;
  sketchHidden: boolean;
  toggleSketchHidden: () => void;
  addNewPage: () => void;
  onPageChange: (page: number) => void;
}

const ReplayerOverlayContext = createContext<IReplayerOverlayContext | null>(
  null
);

const ReplayerOverlayProvider = ({
  children,
  replayer,
}: {
  children: ReactNode;
  replayer: Replayer;
}) => {
  const {
    activeNote,
    notes: { [SessionNoteType.Sketch]: sketchNotes },
    addSessionNote,
    updateSessionNote,
  } = useDebugSessionNotes();
  const [isPlaying, setIsPlaying] = useState(false);
  const [tool, setTool] = useState<ReplayerOverlayTool | null>(
    ReplayerOverlayTool.Sketch
  );
  const [sketchHidden, setSketchHidden] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentTime, setCurrentTime] = useState(
    normalizeTimestamp(replayer?.getCurrentTime())
  );
  const { sketchState, sketchControl, setSketchAPI } = useSketchControl();
  const elementInspectorAvailable = useElementInspectorAvailable();

  const currentTimeNotes = useMemo(
    () => sketchNotes.filter((note) => note.timestamp === currentTime),
    [sketchNotes, currentTime]
  );

  const currentPageNote = useMemo(
    () => currentTimeNotes[currentPage] || null,
    [currentTimeNotes, currentPage]
  );

  useEffect(() => {
    if (!elementInspectorAvailable && tool === ReplayerOverlayTool.Inspector) {
      setTool(ReplayerOverlayTool.Sketch);
    }
  }, [elementInspectorAvailable, tool]);

  useEffect(() => {
    if (!replayer) return;
    const inspectorInteractive =
      tool === ReplayerOverlayTool.Inspector &&
      elementInspectorAvailable &&
      !isPlaying;
    replayer.iframe.style.pointerEvents = inspectorInteractive
      ? "auto"
      : "none";
  }, [replayer, tool, elementInspectorAvailable, isPlaying]);

  const onToolChange = (nextTool: ReplayerOverlayTool | null) => {
    setTool(nextTool);
    if (nextTool === ReplayerOverlayTool.Inspector) {
      setSketchHidden(true);
    } else {
      setSketchHidden(false);
    }
  };

  const toggleSketchHidden = () => {
    setSketchHidden((prev) => !prev);
  };

  const onSketchChange = (elements: any[]) => {
    if (!replayer) return;
    const oldElements = currentPageNote?.metadata?.elements || [];
    if (JSON.stringify(elements) === JSON.stringify(oldElements)) {
      return;
    }
    let noteId = currentPageNote?.id;
    if (!currentPageNote) {
      noteId = uuidv4();
      addSessionNote({
        id: noteId,
        note: "",
        timestamp: currentTime,
        metadata: { elements },
        type: SessionNoteType.Sketch,
        title: `Sketch at ${formatTime(currentTime)}`,
      });
    } else {
      updateSessionNote(currentPageNote.id, {
        metadata: { ...currentPageNote.metadata, elements },
      });
    }
  };

  const onElementSelect = (path: ElementPath[]) => {};

  useEffect(() => {
    if (!sketchState.isReady) return;
    if (currentPageNote) {
      sketchControl.setElements(
        clone(currentPageNote.metadata.elements),
        false
      );
    }
    return () => {
      sketchControl.clearCanvas();
    };
  }, [
    replayer,
    currentTime,
    sketchState.isReady,
    currentPageNote,
    sketchControl,
  ]);

  useEffect(() => {
    if (!replayer) return;
    setCurrentPage(0);
    setCurrentTime(normalizeTimestamp(replayer.getCurrentTime()));
    let state;
    const debounceUpdate = debounce(() => {
      setIsPlaying(state === "playing");
      setCurrentPage(activeNote.current?.page || 0);
      setCurrentTime(normalizeTimestamp(replayer.getCurrentTime()));
      activeNote.current = null;
    }, 100);

    const onStart = () => {
      state = "playing";
      debounceUpdate();
    };

    const onStop = () => {
      state = "paused";
      debounceUpdate();
    };

    replayer.on("start", onStart);
    replayer.on("finish", onStop);
    replayer.on("pause", onStop);

    return () => {
      replayer.off("start", onStart);
      replayer.off("finish", onStop);
      replayer.off("pause", onStop);
    };
  }, [replayer]);

  const addNewPage = () => {
    setCurrentPage(currentPage + 1);
  };

  return (
    <ReplayerOverlayContext.Provider
      value={{
        tool,
        replayer,
        currentPage,
        sketchState,
        sketchControl,
        currentTime,
        disabled: isPlaying,
        currentPageNote,
        currentTimeNotes,
        onToolChange,
        sketchHidden,
        toggleSketchHidden,
        onSketchChange,
        onElementSelect,
        addNewPage,
        onPageChange: setCurrentPage,
        setSketchAPI,
      }}
    >
      {children}
    </ReplayerOverlayContext.Provider>
  );
};

export function useReplayerOverlay() {
  const context = useContext(ReplayerOverlayContext);
  if (context === null) {
    throw new Error(
      "useReplayerOverlay must be used within ReplayerOverlayProvider"
    );
  }
  return context;
}

export { ReplayerOverlayProvider };
