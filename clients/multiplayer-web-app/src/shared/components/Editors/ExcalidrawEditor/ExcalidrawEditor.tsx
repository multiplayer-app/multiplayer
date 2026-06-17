import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Excalidraw, parseLibraryTokensFromUrl } from "@excalidraw/excalidraw";
import {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/excalidraw/types/element/types";
import {
  AppState,
  BinaryFiles,
  ExcalidrawProps,
  ToolType,
} from "@excalidraw/excalidraw/types/types";

import {
  ExcalidrawProvider,
  useExcalidraw,
} from "shared/providers/ExcalidrawContext";
import { useMultiplayerStateContext } from "shared/providers/MultiplayerStateContext";
import { useAuth } from "shared/providers/AuthContext";
import ExcalidrawCursors from "./ExcalidrawCursors";
import "./ExcalidrawEditor.scss";
import { useColorMode } from "@chakra-ui/react";

const toolbarClassName = "App-toolbar";

const ExcalidrawEditorContent = ({
  children,
  setCommentMode,
  commentMode,
  data,
  readonly,
  ...rest
}: Omit<ExcalidrawProps, "excalidrawAPI" | "onChange" | "onPointerUpdate"> & {
  setCommentMode?: (mode: boolean) => void;
  commentMode?: boolean;
  readonly?: boolean;
  data?: { elements: ExcalidrawElement[]; files: BinaryFiles };
}) => {
  const { colorMode } = useColorMode();
  const {
    setEditor,
    onPointerUpdate,
    onChange,
    editor,
    updateScene,
    selectedTool,
    setSelectedTool,
    viewportState,
  } = useExcalidraw();
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { projectId } = useParams();
  const linkCbUpdatedRef = useRef(null);
  const cacheKey = useMemo(
    () => "excalidraw-tool-" + userId + projectId,
    [userId, projectId]
  );

  useEffect(() => {
    if (data && editor) {
      setTimeout(() => {
        updateScene({ elements: data.elements });
        editor.scrollToContent(data.elements, {
          fitToContent: true,
        });
      });
    }
  }, [data, editor]);

  useEffect(() => {
    if (location.hash && editor) {
      const libraryUrlTokens = parseLibraryTokensFromUrl();
      if (libraryUrlTokens) {
        navigate(location.pathname, { replace: true });

        const libraryPromise = new Promise<Blob>(async (resolve, reject) => {
          try {
            const request = await fetch(
              decodeURIComponent(libraryUrlTokens.libraryUrl)
            );
            const blob = await request.blob();
            resolve(blob);
          } catch (error: any) {
            reject(error);
          }
        });

        editor.updateLibrary({
          libraryItems: libraryPromise,
          merge: true,
          openLibraryMenu: true,
        });
      }
    }
  }, [location.hash, editor]);

  const onEditorChange = (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => {
    if (selectedTool !== appState.activeTool.type && commentMode) {
      setCommentMode(false);
    }
    setSelectedTool(appState.activeTool.type);

    const selectedLinkedElementIds = elements
      .filter((el) => appState?.selectedElementIds?.[el.id] && el.link)
      .map((e) => e.id);

    if (selectedLinkedElementIds.length !== 1) {
      linkCbUpdatedRef.current = null;
    } else if (selectedLinkedElementIds[0] !== linkCbUpdatedRef?.current) {
      // fix excalidraw issue of removing links
      // temporary solution until they fix it in the next versions
      rewriteLinkRemoval(selectedLinkedElementIds, elements);
    }

    onChange(elements, appState, files);
  };

  const rewriteLinkRemoval = (
    selectedIds: string[],
    elements: readonly ExcalidrawElement[]
  ) => {
    const removeLinkBtn = document.querySelector(
      ".excalidraw-hyperlinkContainer--remove"
    ) as HTMLElement;

    if (removeLinkBtn) {
      removeLinkBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        editor.updateScene({
          appState: {
            showHyperlinkPopup: false,
          },
          elements: elements.map((el) =>
            selectedIds.includes(el.id) ? { ...el, link: null } : el
          ),
        });
      };

      linkCbUpdatedRef.current = selectedIds[0];
    }
  };

  const isToolClicked = useCallback(
    (target: HTMLElement, elementTitle: string): boolean => {
      if (!target) {
        return false;
      }

      if (target.title?.includes(elementTitle)) {
        return true;
      }

      if (target.classList?.contains(toolbarClassName)) {
        // end recursion if reached to toolbar
        return false;
      }

      // do recursion through the parent element
      return isToolClicked(target.parentElement, elementTitle);
    },
    []
  );

  const handleToolChange = useCallback(
    (event): void => {
      if (isToolClicked(event.target, "Selection") && commentMode) {
        setCommentMode(false);
      }
    },
    [commentMode, isToolClicked, setCommentMode]
  );

  useEffect(() => {
    const toolbar = (document.getElementsByClassName(toolbarClassName) ||
      [])[0];

    toolbar?.addEventListener("click", handleToolChange);

    return () => {
      toolbar?.removeEventListener("click", handleToolChange);
    };
  }, [handleToolChange, editor, commentMode]);

  const onLinkOpen = useCallback(
    (
      element: NonDeletedExcalidrawElement,
      event: CustomEvent<{
        nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement>;
      }>
    ) => {
      const link = element.link!;
      event.preventDefault();
      window.open(link, "_blank");
    },
    []
  );

  return (
    <Excalidraw
      {...rest}
      onChange={onEditorChange}
      viewModeEnabled={!!readonly}
      onPointerUpdate={onPointerUpdate}
      onLinkOpen={onLinkOpen}
      excalidrawAPI={setEditor}
      theme={colorMode === "dark" ? "dark" : "light"}
      initialData={{
        appState: {
          activeTool: {
            lastActiveTool: null,
            type: (localStorage.getItem(cacheKey) as ToolType) || "selection",
            customType: null,
            locked: false,
          },
          ...viewportState,
        },
      }}
    >
      {children}
      <ExcalidrawCursors />
    </Excalidraw>
  );
};

const ExcalidrawEditor = (props) => {
  const { provider, doc } = useMultiplayerStateContext();
  return (
    <ExcalidrawProvider provider={provider} doc={doc}>
      <ExcalidrawEditorContent {...props} />
    </ExcalidrawProvider>
  );
};

export { ExcalidrawEditor, ExcalidrawEditorContent };
