import React, { useEffect, useState, useCallback, useRef } from "react";
import { Box, useColorMode } from "@chakra-ui/react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";

import { useIframeTransform } from "../../hooks/useIframeTransform";
import {
  calculateSketchZoom,
  calculateSketchOffset,
} from "../../utils/coordinateTransform";

import "./Sketch.scss";
import { SKETCH_TOOLS } from "../../hooks/useSketchControl";
import {
  ReplayerOverlayTool,
  useReplayerOverlay,
} from "../ReplayerOverlayContext";
import debounce from "lodash.debounce";
import { clone } from "shared/utils";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface SketchProps {
  isActive: boolean;
  replayer: any;
  containerRef: React.RefObject<HTMLDivElement>;
  readonly?: boolean;
}

const Sketch: React.FC<SketchProps> = ({
  isActive,
  replayer,
  containerRef,
  readonly,
}) => {
  const { colorMode } = useColorMode();

  const { withSandboxCheck } = useProjectSandbox();
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const elementsRef = useRef<any[]>([]);
  const excalidrawRef = useRef<HTMLDivElement>(null);
  const iframeTransform = useIframeTransform(replayer, containerRef);
  const {
    tool,
    disabled,
    sketchHidden,
    sketchState,
    sketchControl,
    setSketchAPI,
    onSketchChange,
  } = useReplayerOverlay();

  // Expose API to context when it becomes available
  useEffect(() => {
    if (excalidrawAPI) {
      setSketchAPI(excalidrawAPI);
    }
  }, [excalidrawAPI, setSketchAPI]);

  useEffect(() => {
    if (!iframeTransform.scale || !excalidrawAPI) return;
    const sketchZoom = calculateSketchZoom(iframeTransform);
    const sketchOffset = calculateSketchOffset(iframeTransform);

    sketchControl.setZoom(sketchZoom);
    sketchControl.setPosition(sketchOffset.x, sketchOffset.y);
  }, [iframeTransform, sketchControl, excalidrawAPI]);

  const handleScrollChange = useCallback(
    (scrollX: number, scrollY: number) => {
      // Prevent scrolling by resetting to the correct position from iframe transform
      if (excalidrawAPI && (scrollX !== 0 || scrollY !== 0)) {
        const sketchZoom = calculateSketchZoom(iframeTransform);
        const sketchOffset = calculateSketchOffset(iframeTransform);
        sketchControl.setZoom(sketchZoom);
        sketchControl.setPosition(sketchOffset.x, sketchOffset.y);
      }
    },
    [excalidrawAPI, iframeTransform, sketchControl]
  );

  const handleChange = debounce((elements: any[], appState: any) => {
    const elementsClone = clone(elements);
    if (JSON.stringify(elementsRef.current) !== JSON.stringify(elementsClone)) {
      elementsRef.current = elementsClone;
      onSketchChange(elementsClone.filter(({ isDeleted }) => !isDeleted));
    }
    if (appState.activeTool.type !== sketchState.tool) {
      if (appState.activeTool.type in SKETCH_TOOLS) {
        sketchControl.setSketchTool(appState.activeTool.type);
      } else {
        sketchControl.setSketchTool(sketchState.tool);
      }
    }
  }, 400);

  const sketchInteractive = isActive && !readonly;
  const sketchPointerEvents = sketchInteractive ? "auto" : "none";
  const hideSketch = tool === ReplayerOverlayTool.Inspector && sketchHidden;

  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      width="100%"
      height="100%"
      ref={excalidrawRef}
      className={`sketch-tool-container${
        tool === ReplayerOverlayTool.Inspector
          ? " sketch-tool-container--inspect"
          : ""
      }`}
      style={{ background: "transparent" }}
      opacity={hideSketch ? 0 : tool === ReplayerOverlayTool.Sketch ? 1 : 0.3}
      visibility={hideSketch ? "hidden" : "visible"}
      pointerEvents={sketchPointerEvents}
      onClick={
        readonly && sketchInteractive ? withSandboxCheck(() => {}) : undefined
      }
    >
      <Box width="100%" height="100%" pointerEvents={sketchPointerEvents}>
        <Excalidraw
          onChange={handleChange}
          excalidrawAPI={setExcalidrawAPI}
          onScrollChange={handleScrollChange}
          objectsSnapModeEnabled={false}
          initialData={{
            elements: [],
            appState: {
              viewBackgroundColor: "transparent",
              currentItemStrokeColor: sketchState.color,
              currentItemStrokeWidth: 2,
              currentItemFontSize: 46,
              zoom: { value: 1 as any },
              scrollX: 0,
              scrollY: 0,
              activeTool: {
                type: sketchState.tool,
                locked: false,
                customType: null,
                lastActiveTool: null,
              },
              gridSize: null,
              zenModeEnabled: true,
              showWelcomeScreen: false,
              showStats: false,
            },
            scrollToContent: false,
            files: {},
          }}
          zenModeEnabled={false}
          gridModeEnabled={false}
          viewModeEnabled={!isActive || disabled || readonly}
          theme={colorMode}
          name="sketch-tool"
          detectScroll={false}
          handleKeyboardGlobally={false}
          UIOptions={UIOptions}
        />
      </Box>
    </Box>
  );
};

const UIOptions: any = {
  canvasActions: {
    export: false,
    loadScene: false,
    toggleTheme: false,
    saveAsImage: false,
    clearCanvas: false,
    saveToActiveFile: false,
  },
  dockedSidebarBreakpoint: 0,
  welcomeScreen: false,
  tools: {
    image: false,
  },
};

export default Sketch;
