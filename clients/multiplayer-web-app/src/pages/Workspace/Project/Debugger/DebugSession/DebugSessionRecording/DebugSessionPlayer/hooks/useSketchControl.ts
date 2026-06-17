import { useCallback, useMemo, useRef, useState } from 'react';
import { ExcalidrawImperativeAPI, ToolType } from '@excalidraw/excalidraw/types/types';

import { EraserIcon, PencilOIcon, SelectCursorIcon, ToolArrowIcon, ToolEllipseIcon, ToolRectIcon, ToolTextIcon } from 'shared/icons';


export const useSketchControl = () => {
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [tool, setTool] = useState<ToolType>(DEFAULT_TOOL);
  const sketchAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [isReady, setIsReady] = useState(false);

  const setSketchAPI = useCallback((api: ExcalidrawImperativeAPI | null) => {
    sketchAPIRef.current = api;
    setIsReady(true);
  }, []);

  const setZoom = useCallback((zoom: number) => {
    if (!sketchAPIRef.current) return;

    sketchAPIRef.current.updateScene({
      appState: { zoom: { value: zoom as any }, },
    });
  }, []);

  const setPosition = useCallback((x: number, y: number) => {
    if (!sketchAPIRef.current) return;
    sketchAPIRef.current.updateScene({
      appState: { scrollX: x, scrollY: y },
    });
  }, []);

  const clearCanvas = useCallback((commitToHistory: boolean = false) => {
    if (!sketchAPIRef.current) return;
    sketchAPIRef.current.history.clear(true);
    sketchAPIRef.current.updateScene({
      elements: [], commitToHistory,
    });
  }, []);

  const getElements = useCallback(() => {
    if (!sketchAPIRef.current) return [];

    return sketchAPIRef.current.getSceneElements();
  }, []);

  const setStrokeColor = useCallback((currentItemStrokeColor: string) => {
    if (!sketchAPIRef.current) return;

    setColor(currentItemStrokeColor);
    sketchAPIRef.current.updateScene({
      appState: { currentItemStrokeColor },
    });
  }, []);

  const setSketchTool = useCallback((tool: ToolType) => {
    if (!sketchAPIRef.current) return;

    setTool(tool);
    sketchAPIRef.current.setActiveTool({ type: tool });
  }, []);

  const setElements = useCallback((elements: any[], commitToHistory: boolean) => {
    if (!sketchAPIRef.current) return;
    sketchAPIRef.current.updateScene({ elements, commitToHistory });
  }, []);

  const sketchControl: SketchControlAPI = useMemo(() => ({
    setZoom,
    setPosition,
    clearCanvas,
    getElements,
    setElements,
    setSketchTool,
    setStrokeColor,
  }), [setZoom, setPosition, clearCanvas, getElements, setStrokeColor, setSketchTool]);

  const sketchState: SketchState = useMemo(() => ({
    tool,
    color,
    isReady,
  }), [tool, isReady, color]);

  return {
    sketchState,
    sketchControl,
    setSketchAPI,
  };
};



export interface SketchState {
  tool: ToolType;
  color: string;
  isReady: boolean;
}

export interface SketchControlAPI {
  setZoom: (zoom: number) => void;
  setPosition: (x: number, y: number) => void;
  clearCanvas: (commitToHistory?: boolean) => void;
  getElements: () => readonly any[];
  setStrokeColor: (color: string) => void;
  setSketchTool: (tool: ToolType) => void;
  setElements: (elements: any[], commitToHistory: boolean) => void;
}

export const DEFAULT_COLOR = "#e03131";
export const DEFAULT_TOOL = "freedraw";
export const COLORS = ["#e03131", "#1971c2", "#f08c00", "#1e1e1e"];

export const SKETCH_TOOLS = {
  selection: { label: "Selection", icon: SelectCursorIcon, },
  freedraw: { label: "Free Draw", icon: PencilOIcon, },
  rectangle: { label: "Rectangle", icon: ToolRectIcon, },
  ellipse: { label: "Ellipse", icon: ToolEllipseIcon, },
  arrow: { label: "Arrow", icon: ToolArrowIcon, },
  eraser: { label: "Eraser", icon: EraserIcon, },
  text: { label: "Text", icon: ToolTextIcon, },
};