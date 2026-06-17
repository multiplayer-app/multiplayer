import {
  useRef,
  useState,
  useEffect,
  useContext,
  createContext,
  PropsWithChildren,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import * as Y from "yjs";
import CryptoJS from "crypto-js";
import throttle from "lodash.throttle";
import {
  Gesture,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  Zoom,
} from "@excalidraw/excalidraw/types/types";

import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";
import useYUndoManager, {
  UseUndoManagerReturn,
} from "shared/hooks/useYUndoManager";

import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { useAuth } from "shared/providers/AuthContext";
import { PostHogEvents } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";

const ExcalidrawContext = createContext<{
  onChange: any;
  editor: ExcalidrawImperativeAPI;
  onPointerUpdate: any;
  undoManager: UseUndoManagerReturn;
  provider: YjsSocketIOProvider;
  updateScene: (sceneData: {
    elements?: ExcalidrawElement[];
    files?: BinaryFiles;
  }) => void;
  setEditor: React.Dispatch<React.SetStateAction<ExcalidrawImperativeAPI>>;
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  viewportState: ViewportState;
}>(null);

export interface ExcalidrawProviderProps extends PropsWithChildren {
  provider: YjsSocketIOProvider;
  doc: Y.Doc;
  tabState?: ViewportState,
  setTabState?: (state: ViewportState) => void
}

export interface ViewportState {
  zoom: Zoom;
  scrollX: number;
  scrollY: number;
}

const persistedStateProps = ["zoom", "scrollX", "scrollY"];

const useTimeoutState = (val, debounce = 1000) => {
  const timeRef = useRef<NodeJS.Timeout>();
  const [value, setValue] = useState(val);

  const setCallback = (newValue) => {
    setValue(newValue);

    clearTimeout(timeRef.current);
    timeRef.current = setTimeout(() => {
      setValue(val);
    }, debounce);
  };
  return [value, setCallback];
};

export const ExcalidrawProvider = ({
  provider,
  doc,
  tabState,
  setTabState,
  children,
}: ExcalidrawProviderProps) => {
  const [editor, setEditor] = useState<ExcalidrawImperativeAPI>(null);
  const [isEditing, setIsEditing] = useTimeoutState(false, 1000);
  const { trackEvent } = useAnalytics();
  const filesStateHex = useRef(null);
  const elementsStateHex = useRef(null);
  const sceneUpdateTimer = useRef<NodeJS.Timeout>();
  const { userId } = useAuth();
  const { projectId, path } = useParams();
  const cacheKey = useMemo(
    () => "excalidraw-tool-" + userId + projectId,
    [userId, projectId]
  );
  const [selectedTool, setSelectedTool] = useState(
    localStorage.getItem(cacheKey)
  );

  const undoManager = useYUndoManager([
    doc.getMap("elements"),
    doc.getMap("files"),
  ]);

  useEffect(() => {
    if (provider) {
      undoManager.instance.current.addTrackedOrigin(provider.socket.id);
    }
  }, [provider, undoManager.instance]);

  useEffect(() => {
    if (selectedTool) {
      localStorage.setItem(cacheKey, selectedTool);
    }
  }, [selectedTool]);

  const deepCopy = (data) => {
    try {
      return JSON.parse(JSON.stringify(data))
    } catch (err) {
      console.error(err)
      return data
    }
  }

  function calculateHashCode(jsonObj: object) {
    return CryptoJS.SHA256(JSON.stringify(jsonObj)).toString();
  }

  const updateScene = (sceneData: {
    elements?: (ExcalidrawElement & { order: number })[];
    files?: BinaryFiles;
  }) => {
    if (sceneData.elements) {
      const sorted = sceneData.elements.sort((a, b) => a.order - b.order);
      elementsStateHex.current = calculateHashCode(sorted);
      editor.updateScene({
        elements: deepCopy(sorted),
      });
    }
    if (sceneData.files) {
      filesStateHex.current = calculateHashCode(Object.keys(sceneData.files));
      editor.addFiles(Object.values(sceneData.files));
    }
  };

  useEffect(() => {
    if (!provider.synced || !editor) return;

    const elements = doc.getMap<ExcalidrawElement & { order: number; }>("elements");
    const files = doc.getMap("files");
    if (!isEditing) {
      updateScene({
        elements: Array.from(elements.values()),
        files: files.toJSON(),
      });
    }

    const elementsObserver = (event) => {
      if (event.transaction.origin === provider.socket.id) return;
      if (!isEditing) {
        updateScene({ elements: Array.from(elements.values()) });
      } else {
        clearTimeout(sceneUpdateTimer.current);
        sceneUpdateTimer.current = setTimeout(() => {
          elementsObserver(event);
        }, 300);
      }
    };

    const filesObserver = (event) => {
      if (event.transaction.origin === provider.socket.id) return;
      updateScene({ files: files.toJSON() });
    };

    elements.observe(elementsObserver);
    files.observe(filesObserver);

    return () => {
      elements.unobserve(elementsObserver);
      files.unobserve(filesObserver);
    };
  }, [provider, editor, doc, isEditing]);

  const onPointerUpdateThrottle = throttle(
    (payload: ExcalidrawPointerUpdatePayload) => {
      if (payload.pointersMap.size < 2)
        // no idea why, but they have this restriction in their collab module
        provider?.awareness.setLocalStateField(payload.pointer.tool, payload);
    },
    125
  );

  const onChangeThrottle = throttle(() => {
    const elements = editor.getSceneElementsIncludingDeleted();
    const files = editor.getFiles();
    const appState = editor.getAppState();
    const { zoom, scrollX, scrollY } = appState;

    const currentElementsHex = calculateHashCode(elements);
    const currentFilesHex = calculateHashCode(Object.keys(files));
    if (
      elementsStateHex.current &&
      currentElementsHex !== elementsStateHex.current
    ) {
      setIsEditing(true);
      elementsStateHex.current = currentElementsHex;
      const elementsMap = doc.getMap("elements");
      if (elementsMap.size < editor.getSceneElements().length) {
        trackEvent(PostHogEvents.ADD_DRAWING_TO_SKETCH, {
          sketchId: path,
        });
      }
      doc.transact(() => {
        const existingKeys = Array.from(elementsMap?.keys()).reduce(
          (acc, key: string) => {
            acc[key] = true;
            return acc;
          },
          {} as Record<string, boolean>
        );

        elements.forEach((element, index) => {
          if (element.isDeleted) {
            elementsMap.delete(element.id);
            return;
          }
          const data = { ...element, order: index }
          if (JSON.stringify(elementsMap.get(element.id)) !== JSON.stringify(data)) {
            elementsMap.set(element.id, deepCopy(data));
          }
          delete existingKeys[element.id];
        });
      }, provider.socket.id);
    }

    if (filesStateHex.current && currentFilesHex !== filesStateHex.current) {
      filesStateHex.current = calculateHashCode(Object.keys(files));
      doc.transact(() => {
        const filesMap = doc.getMap("files");
        Object.keys(files).forEach((key) => {
          if (filesMap.has(key)) return;
          filesMap.set(key, files[key]);
        });
      }, provider.socket.id);
    }

    if (tabState && setTabState) {
      const hasStateChanged = persistedStateProps.some((prop) => tabState[prop] !== appState[prop]);

      if (hasStateChanged) {
        setTabState({
          zoom,
          scrollX,
          scrollY,
        });
      }
    }
  }, 125);

  const onPointerUpdate = (payload: ExcalidrawPointerUpdatePayload) => {
    onPointerUpdateThrottle(payload);
  };

  return (
    <ExcalidrawContext.Provider
      value={{
        editor,
        provider,
        onChange: onChangeThrottle,
        setEditor,
        onPointerUpdate,
        undoManager,
        updateScene,
        selectedTool,
        setSelectedTool,
        viewportState: tabState,
      }}
    >
      {children}
    </ExcalidrawContext.Provider>
  );
};

interface ExcalidrawPointerUpdatePayload {
  pointer: { x: number; y: number; tool: "pointer" | "laser" };
  button: "down" | "up";
  pointersMap: Gesture["pointers"];
}

export function useExcalidraw() {
  const context = useContext(ExcalidrawContext);
  if (context === null) {
    throw new Error("useExcalidraw must be used within ExcalidrawProvider");
  }
  return context;
}
