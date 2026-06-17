import React, { useEffect, useState, useCallback, useRef } from "react";
import ElementPropertiesPanel from "./ElementPropertiesPanel";
import { useReplayerOverlay } from "../ReplayerOverlayContext";
import { attachInspectorInteractionShield } from "./inspectorInteractionShield";
import {
  getElementClassName,
  resolveElementAtPathIndex,
} from "./elementPathUtils";
import {
  INSPECTOR_HIGHLIGHT_HOVER_ID,
  INSPECTOR_HIGHLIGHT_SELECTED_ID,
  removeInspectorHighlights,
  upsertInspectorHighlight,
} from "./inspectorHighlight";

export interface ElementPath {
  tagName: string;
  className?: string;
  id?: string;
  nthChild?: number;
  attributes?: Record<string, string>;
}

interface ElementInspectorProps {
  iframe: HTMLIFrameElement | null;
  onElementSelect?: (path: ElementPath[], element: Element) => void;
  isActive?: boolean;
}

const ElementInspector: React.FC<ElementInspectorProps> = ({
  iframe,
  onElementSelect,
  isActive = false,
}) => {
  const { disabled: isPlaying } = useReplayerOverlay();
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [anchorPath, setAnchorPath] = useState<ElementPath[]>([]);
  const [selectedPathIndex, setSelectedPathIndex] = useState(-1);
  const [pathHoverIndex, setPathHoverIndex] = useState<number | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

  const hoveredElementRef = useRef<Element | null>(null);
  const selectedElementRef = useRef<Element | null>(null);
  const pathHoverIndexRef = useRef<number | null>(null);
  const anchorPathRef = useRef<ElementPath[]>([]);

  const inspectorInteractive = isActive && !isPlaying;

  hoveredElementRef.current = hoveredElement;
  selectedElementRef.current = selectedElement;
  pathHoverIndexRef.current = pathHoverIndex;
  anchorPathRef.current = anchorPath;

  const generateElementPath = useCallback(
    (element: Element): ElementPath[] => {
      const path: ElementPath[] = [];
      let currentElement: Element | null = element;

      while (
        currentElement &&
        currentElement !== iframe?.contentDocument?.body
      ) {
        const pathItem: ElementPath = {
          tagName: currentElement.tagName.toLowerCase(),
        };

        if (currentElement.id) {
          pathItem.id = currentElement.id;
        }

        const elementClassName = getElementClassName(currentElement);
        if (elementClassName) {
          pathItem.className = elementClassName;
        }

        if (currentElement.parentElement) {
          const siblings = Array.from(currentElement.parentElement.children);
          const index = siblings.indexOf(currentElement);
          pathItem.nthChild = index + 1;
        }

        const importantAttributes = [
          "data-testid",
          "data-cy",
          "role",
          "aria-label",
        ];
        const attributes: Record<string, string> = {};
        importantAttributes.forEach((attr) => {
          const value = currentElement.getAttribute(attr);
          if (value) {
            attributes[attr] = value;
          }
        });

        if (Object.keys(attributes).length > 0) {
          pathItem.attributes = attributes;
        }

        path.unshift(pathItem);
        currentElement = currentElement.parentElement;
      }

      return path;
    },
    [iframe]
  );

  const clearInspectorState = useCallback(() => {
    removeInspectorHighlights(iframe?.contentDocument ?? null);
    setHoveredElement(null);
    setSelectedElement(null);
    setAnchorPath([]);
    setSelectedPathIndex(-1);
    setPathHoverIndex(null);
    setShowPropertiesPanel(false);
  }, [iframe]);

  const applySelectedHighlight = useCallback(
    (element: Element | null) => {
      if (!iframe?.contentDocument) return;
      iframe.contentDocument
        .getElementById(INSPECTOR_HIGHLIGHT_HOVER_ID)
        ?.remove();
      if (!element) return;
      upsertInspectorHighlight(iframe, element, "selected");
    },
    [iframe]
  );

  const applyHoverHighlight = useCallback(
    (element: Element | null) => {
      if (!iframe?.contentDocument) return;
      if (!element) {
        iframe.contentDocument
          .getElementById(INSPECTOR_HIGHLIGHT_HOVER_ID)
          ?.remove();
        return;
      }
      if (element === selectedElementRef.current) {
        iframe.contentDocument
          .getElementById(INSPECTOR_HIGHLIGHT_HOVER_ID)
          ?.remove();
        return;
      }
      upsertInspectorHighlight(iframe, element, "hover");
    },
    [iframe]
  );

  const selectElement = useCallback(
    (element: Element, path: ElementPath[], pathIndex: number) => {
      setSelectedElement(element);
      setAnchorPath(path);
      setSelectedPathIndex(pathIndex);
      setPathHoverIndex(null);
      setHoveredElement(null);
      setShowPropertiesPanel(true);
      applySelectedHighlight(element);
      onElementSelect?.(path.slice(0, pathIndex + 1), element);
    },
    [applySelectedHighlight, onElementSelect]
  );

  const refreshSelectedHighlight = useCallback(() => {
    if (!iframe || !selectedElementRef.current || !inspectorInteractive) {
      return;
    }
    try {
      if (!selectedElementRef.current.isConnected) {
        clearInspectorState();
        return;
      }
      if (pathHoverIndexRef.current === null) {
        applySelectedHighlight(selectedElementRef.current);
      }
    } catch {
      clearInspectorState();
    }
  }, [
    iframe,
    inspectorInteractive,
    clearInspectorState,
    applySelectedHighlight,
  ]);

  const getElementAtPoint = useCallback(
    (doc: Document, clientX: number, clientY: number) => {
      const fromPoint =
        doc.elementsFromPoint?.(clientX, clientY) ??
        (doc.elementFromPoint(clientX, clientY)
          ? [doc.elementFromPoint(clientX, clientY)!]
          : []);

      return (
        fromPoint.find(
          (el) =>
            el.id !== INSPECTOR_HIGHLIGHT_HOVER_ID &&
            el.id !== INSPECTOR_HIGHLIGHT_SELECTED_ID &&
            el.id !== "mp-inspector-highlight"
        ) ?? null
      );
    },
    []
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (pathHoverIndexRef.current !== null) return;
      if (!iframe?.contentDocument) return;

      const element = getElementAtPoint(
        iframe.contentDocument,
        event.clientX,
        event.clientY
      );

      if (element === hoveredElementRef.current) return;

      setHoveredElement(element);
      applyHoverHighlight(element);
    },
    [iframe, getElementAtPoint, applyHoverHighlight]
  );

  const handlePick = useCallback(
    (event: MouseEvent) => {
      const doc = iframe?.contentDocument;
      if (!doc) return;

      const element = getElementAtPoint(doc, event.clientX, event.clientY);
      if (!element) return;

      const path = generateElementPath(element);
      selectElement(element, path, path.length - 1);
    },
    [iframe, generateElementPath, getElementAtPoint, selectElement]
  );

  const handlePathSegmentSelect = useCallback(
    (index: number) => {
      if (!iframe) return;
      const path = anchorPathRef.current;
      const element = resolveElementAtPathIndex(iframe, path, index);
      if (!element) return;
      selectElement(element, path, index);
    },
    [iframe, selectElement]
  );

  const handlePathSegmentPrune = useCallback(
    (index: number) => {
      if (!iframe) return;
      const path = anchorPathRef.current.slice(0, index + 1);
      const element = resolveElementAtPathIndex(iframe, path, index);
      if (!element) return;
      selectElement(element, path, index);
    },
    [iframe, selectElement]
  );

  const handlePathSegmentHover = useCallback(
    (index: number | null) => {
      setPathHoverIndex(index);
      pathHoverIndexRef.current = index;

      if (!iframe) return;

      if (index === null) {
        applyHoverHighlight(null);
        if (selectedElementRef.current) {
          applySelectedHighlight(selectedElementRef.current);
        }
        return;
      }

      const path = anchorPathRef.current;
      const element = resolveElementAtPathIndex(iframe, path, index);
      applyHoverHighlight(element);
    },
    [iframe, applyHoverHighlight, applySelectedHighlight]
  );

  useEffect(() => {
    if (!inspectorInteractive) {
      clearInspectorState();
    }
  }, [inspectorInteractive, clearInspectorState]);

  useEffect(() => {
    const doc = iframe?.contentDocument;
    if (!doc || !inspectorInteractive) {
      if (doc) removeInspectorHighlights(doc);
      return;
    }

    const detachShield = attachInspectorInteractionShield(doc, {
      onMouseMove: handleMouseMove,
      onPick: handlePick,
    });

    return () => {
      detachShield();
      removeInspectorHighlights(doc);
    };
  }, [iframe, inspectorInteractive, handleMouseMove, handlePick]);

  useEffect(() => {
    return () => {
      removeInspectorHighlights(iframe?.contentDocument ?? null);
    };
  }, [iframe]);

  useEffect(() => {
    if (!inspectorInteractive || !selectedElement) return;
    refreshSelectedHighlight();
  }, [inspectorInteractive, selectedElement, refreshSelectedHighlight]);

  const handleClosePanel = () => {
    setShowPropertiesPanel(false);
    clearInspectorState();
  };

  const activePath =
    selectedPathIndex >= 0
      ? anchorPath.slice(0, selectedPathIndex + 1)
      : anchorPath;

  return (
    <>
      {inspectorInteractive && selectedElement && showPropertiesPanel && (
        <ElementPropertiesPanel
          element={selectedElement}
          elementPath={activePath}
          anchorPath={anchorPath}
          selectedPathIndex={selectedPathIndex}
          pathHoverIndex={pathHoverIndex}
          onPathSegmentSelect={handlePathSegmentSelect}
          onPathSegmentPrune={handlePathSegmentPrune}
          onPathSegmentHover={handlePathSegmentHover}
          isVisible={showPropertiesPanel}
          onClose={handleClosePanel}
        />
      )}
    </>
  );
};

export default ElementInspector;
