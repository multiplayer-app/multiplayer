import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Icon, useColorMode, UseDisclosureReturn } from "@chakra-ui/react";
import classNames from "classnames";

import Toolbar, {
  ToolbarButton,
  ToolbarButtonGroup,
} from "shared/components/Toolbar";
import { RedoIcon, UndoIcon, CommentLineIcon, SidebarIcon } from "shared/icons";
import VersionsHistory from "shared/components/VersionsHistory";
import { useExcalidraw } from "shared/providers/ExcalidrawContext";
import CommentsToggleButton from "shared/components/CommentsToggleButton";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";

interface SketchToolbarProps {
  readonly: boolean;
  entityThreadsDisclosure: UseDisclosureReturn;
  propertiesDrawerDisclosure: UseDisclosureReturn;
  setCommentMode?: (mode: boolean) => void;
  commentMode?: boolean;
}

const defaultTool = "selection";
const EDITOR_MIN_WIDTH_DESKTOP = 730;

const ExcalidrawSketchToolbar = ({
  readonly,
  entityThreadsDisclosure,
  propertiesDrawerDisclosure,
  setCommentMode,
  commentMode,
}: SketchToolbarProps) => {
  const { colorMode } = useColorMode();
  const { undoManager, editor, setSelectedTool } = useExcalidraw();
  const [isMobileView, setIsMobileView] = useState<boolean>(
    window.innerWidth < EDITOR_MIN_WIDTH_DESKTOP
  );
  const newToolbarRef = useRef();

  const toolbarSelectors = useMemo(() => {
    return isMobileView
      ? {
          toolbar: ".App-toolbar--mobile",
          mobileTools: ".mobile-misc-tools-container",
        }
      : {
          toolbar: ".excalidraw-container .shapes-section",
          mainMenu: ".excalidraw-container .main-menu-trigger",
          helpIcon: ".excalidraw-container .help-icon",
        };
  }, [isMobileView]);

  const resetContainerChildren = (
    container: HTMLElement,
    excludeClassName: string
  ) => {
    if (container?.children?.length > 1) {
      [...container.children].forEach((child) => {
        if (!child.classList.contains(excludeClassName)) {
          container.removeChild(child);
        }
      });
    }
  };

  useEffect(() => {
    const toolbarContainer = newToolbarRef?.current as HTMLElement;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const isMobileNow = entry.contentRect.width < EDITOR_MIN_WIDTH_DESKTOP;

        if (isMobileNow !== isMobileView) {
          resetContainerChildren(toolbarContainer, "ToolIcon-comment");
          setIsMobileView(isMobileNow);
        } else {
          clearInterval(checkToolbar);
        }
      }
    });

    const checkToolbar = setInterval(() => {
      const editorContainer = document.querySelector(
        ".excalidraw-container"
      ) as HTMLElement;

      if (editorContainer) {
        resizeObserver.observe(editorContainer);
      }

      const {
        toolbar = null,
        mobileTools = null,
        mainMenu = null,
        helpIcon = null,
      } = Object.fromEntries(
        Object.entries(toolbarSelectors).map(([key, selector]) => [
          key,
          document.querySelector(selector),
        ])
      );

      // Append the correct toolbar items
      if (toolbarContainer?.children?.length === 1) {
        const appendToToolbar = (
          appendElements: Node[],
          prependElements: Node[] = []
        ) => {
          appendElements.forEach((element: Node) => {
            element && toolbarContainer.appendChild(element);
          });
          prependElements.forEach((element: Node) => {
            element && toolbarContainer.prepend(element);
          });
          if (appendElements.some(Boolean)) {
            clearInterval(checkToolbar);
          }
        };

        if (isMobileView) {
          appendToToolbar([toolbar, mobileTools]);
        } else {
          appendToToolbar([toolbar, helpIcon], [mainMenu]);
        }
      }
    });

    return () => {
      clearInterval(checkToolbar);
      resizeObserver.disconnect();
    };
  }, [newToolbarRef, isMobileView, resetContainerChildren]);

  const toggleCommentMode = useCallback(() => {
    if (!commentMode) {
      editor.setActiveTool({ type: defaultTool });
      setSelectedTool(defaultTool);
    }
    setCommentMode(!commentMode);
  }, [editor, commentMode]);

  return (
    <Toolbar
      overflow="visible"
      leftContent={
        <Box
          ref={newToolbarRef}
          className={`excalidraw injected-toolbar-wrapper theme--${colorMode}`}
        >
          <Box
            className="ToolIcon ToolIcon-comment"
            title="Comment"
            onClick={toggleCommentMode}
            mr={1}
          >
            <Box
              className={classNames("ToolIcon__icon", {})}
              backgroundColor={
                commentMode
                  ? "var(--color-surface-primary-container)"
                  : "transparent"
              }
              _hover={{
                backgroundColor: commentMode
                  ? "var(--color-surface-primary-container)"
                  : "var(--button-hover-bg)",
              }}
            >
              <Icon as={CommentLineIcon} />
            </Box>
          </Box>
        </Box>
      }
      rightContent={
        <>
          <ToolbarButtonGroup>
            <ToolbarButton
              icon={<SidebarIcon />}
              onClick={propertiesDrawerDisclosure.onToggle}
              isActive={propertiesDrawerDisclosure.isOpen}
              label={
                propertiesDrawerDisclosure.isOpen
                  ? "Close Sketch Information"
                  : "Open Sketch Information"
              }
            />
            <CommentsToggleButton disclosure={entityThreadsDisclosure} />
            <FullScreenToggleButton />
            {!readonly && (
              <>
                <ToolbarButton
                  icon={<UndoIcon />}
                  disabled={!undoManager.canUndo}
                  onClick={undoManager.undo}
                  label="Undo"
                />
                <ToolbarButton
                  icon={<RedoIcon />}
                  disabled={!undoManager.canRedo}
                  onClick={undoManager.redo}
                  label="Redo"
                />
              </>
            )}
          </ToolbarButtonGroup>
          <VersionsHistory />
        </>
      }
    />
  );
};

export default ExcalidrawSketchToolbar;
