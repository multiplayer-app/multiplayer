import { useState, useCallback, useRef, useEffect } from 'react';
import { ElementPath } from './ElementInspector';
import { findElementBySelector } from './elementPathUtils';

interface UseElementInspectorProps {
  iframe: HTMLIFrameElement | null;
  onElementSelect?: (path: ElementPath[], element: Element) => void;
}

interface UseElementInspectorReturn {
  isActive: boolean;
  selectedElement: Element | null;
  elementPath: ElementPath[];
  hoveredElement: Element | null;
  showPropertiesPanel: boolean;
  toggleInspector: () => void;
  togglePropertiesPanel: () => void;
  selectElementByPath: (path: ElementPath[]) => Element | null;
  highlightElement: (element: Element | null) => void;
  clearSelection: () => void;
}

export const useElementInspector = ({
  iframe,
  onElementSelect,
}: UseElementInspectorProps): UseElementInspectorReturn => {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [elementPath, setElementPath] = useState<ElementPath[]>([]);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Generate element path
  const generateElementPath = useCallback((element: Element): ElementPath[] => {
    const path: ElementPath[] = [];
    let currentElement: Element | null = element;

    while (currentElement && currentElement !== iframe?.contentDocument?.body) {
      const pathItem: ElementPath = {
        tagName: currentElement.tagName.toLowerCase(),
      };

      if (currentElement.id) {
        pathItem.id = currentElement.id;
      }

      if (currentElement.className && typeof currentElement.className === 'string') {
        pathItem.className = currentElement.className;
      }

      if (currentElement.parentElement) {
        const siblings = Array.from(currentElement.parentElement.children);
        const index = siblings.indexOf(currentElement);
        pathItem.nthChild = index + 1;
      }

      const importantAttributes = ['data-testid', 'data-cy', 'role', 'aria-label'];
      const attributes: Record<string, string> = {};
      importantAttributes.forEach(attr => {
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
  }, [iframe]);

  // Highlight element
  const highlightElement = useCallback((element: Element | null) => {
    if (!iframe?.contentDocument) return;

    // Remove previous highlight
    if (highlightRef.current) {
      highlightRef.current.remove();
      highlightRef.current = null;
    }

    if (!element) return;

    // Create highlight overlay
    const rect = element.getBoundingClientRect();
    const highlight = iframe.contentDocument.createElement('div');
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid #007acc;
      background-color: rgba(0, 122, 204, 0.3);
      pointer-events: none;
      z-index: 1000000000000;
      box-sizing: border-box;
    `;
    highlightRef.current = highlight;
    iframe.contentDocument.body.appendChild(highlight);
  }, [iframe]);

  // Handle mouse events
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isActive || !iframe?.contentDocument) return;

    const element = iframe.contentDocument.elementFromPoint(
      event.clientX,
      event.clientY
    );

    if (element !== hoveredElement) {
      setHoveredElement(element);
      highlightElement(element);
    }
  }, [isActive, iframe, hoveredElement, highlightElement]);

  const handleClick = useCallback((event: MouseEvent) => {
    if (!isActive || !iframe?.contentDocument) return;

    event.preventDefault();
    event.stopPropagation();

    const element = iframe.contentDocument.elementFromPoint(
      event.clientX,
      event.clientY
    );

    if (element) {
      setSelectedElement(element);
      const path = generateElementPath(element);
      setElementPath(path);
      setShowPropertiesPanel(true);
      onElementSelect?.(path, element);
    }
  }, [isActive, iframe, generateElementPath, onElementSelect]);

  // Setup event listeners
  useEffect(() => {
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    if (isActive) {
      // Add event listeners for inspector
      doc.addEventListener('mousemove', handleMouseMove);
      doc.addEventListener('click', handleClick);

      return () => {
        doc.removeEventListener('mousemove', handleMouseMove);
        doc.removeEventListener('click', handleClick);
      };
    }
  }, [iframe, isActive, handleMouseMove, handleClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (highlightRef.current) {
        highlightRef.current.remove();
      }
    };
  }, []);

  // Toggle inspector
  const toggleInspector = useCallback(() => {
    setIsActive(!isActive);
    if (isActive) {
      clearSelection();
    }
  }, [isActive]);

  // Toggle properties panel
  const togglePropertiesPanel = useCallback(() => {
    setShowPropertiesPanel(!showPropertiesPanel);
  }, [showPropertiesPanel]);

  // Select element by path
  const selectElementByPath = useCallback((path: ElementPath[]): Element | null => {
    if (!iframe) return null;

    const selector = path.map(item => {
      let selector = item.tagName;

      if (item.id) {
        selector += `#${item.id}`;
      } else if (item.className) {
        const classes = item.className.split(' ').filter(Boolean);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }

      if (item.nthChild && item.nthChild > 1) {
        selector += `:nth-child(${item.nthChild})`;
      }

      return selector;
    }).join(' > ');

    const element = findElementBySelector(selector, iframe);
    if (element) {
      setSelectedElement(element);
      setElementPath(path);
      highlightElement(element);
      return element;
    }
    return null;
  }, [iframe, highlightElement]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedElement(null);
    setElementPath([]);
    setHoveredElement(null);
    setShowPropertiesPanel(false);
    highlightElement(null);
  }, [highlightElement]);

  return {
    isActive,
    selectedElement,
    elementPath,
    hoveredElement,
    showPropertiesPanel,
    toggleInspector,
    togglePropertiesPanel,
    selectElementByPath,
    highlightElement,
    clearSelection,
  };
};