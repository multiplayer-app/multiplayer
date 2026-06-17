import { ElementPath } from "./ElementInspector";

export const formatElementSelectorFromPath = (path: ElementPath[]): string =>
  path
    .map((item) => {
      let selector = item.tagName || "unknown";

      if (item.id) {
        selector += `#${item.id}`;
      } else if (item.className) {
        const classes = item.className.split(" ").filter(Boolean);
        if (classes.length > 0) {
          selector += `.${classes.join(".")}`;
        }
      }

      if (item.nthChild && item.nthChild > 1) {
        selector += `:nth-child(${item.nthChild})`;
      }

      return selector;
    })
    .join(" > ");

export const formatPathSegmentLabel = (item: ElementPath): string => {
  let label = item.tagName;
  if (item.id) return `${label}#${item.id}`;
  const firstClass = item.className?.split(" ").filter(Boolean)[0];
  if (firstClass) return `${label}.${firstClass}`;
  if (item.nthChild && item.nthChild > 1)
    return `${label}:nth-child(${item.nthChild})`;
  return label;
};

/**
 * Generates a unique CSS selector for an element
 */
export const generateUniqueSelector = (element: Element): string => {
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className && typeof element.className === "string") {
    const classes = element.className.split(" ").filter(Boolean);
    if (classes.length > 0) {
      const selector = `.${classes.join(".")}`;
      const matches = element.ownerDocument.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
    }
  }

  // Fallback to nth-child
  let path: string[] = [];
  let current = element;

  while (current && current !== element.ownerDocument.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === "string") {
      const classes = current.className.split(" ").filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes.join(".")}`;
      }
    }

    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const index = siblings.indexOf(current);
      if (index > 0) {
        selector += `:nth-child(${index + 1})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(" > ");
};

/**
 * Finds an element using a CSS selector within an iframe
 */
export const findElementBySelector = (
  selector: string,
  iframe: HTMLIFrameElement
): Element | null => {
  try {
    return iframe.contentDocument?.querySelector(selector) || null;
  } catch (error) {
    console.error("Error finding element by selector:", error);
    return null;
  }
};

export const getElementClassName = (element: Element): string => {
  const className = element.className;
  if (typeof className === "string") return className;
  const svgClass = className as SVGAnimatedString | undefined;
  if (svgClass?.baseVal) return svgClass.baseVal;
  return "";
};

const normalizeClassList = (className: string) =>
  className.split(/\s+/).filter(Boolean).sort().join(" ");

const classNameMatches = (element: Element, className?: string): boolean => {
  if (!className) return true;
  const elementClass = getElementClassName(element);
  if (elementClass === className) return true;
  return normalizeClassList(elementClass) === normalizeClassList(className);
};

const attributesMatch = (
  element: Element,
  attributes?: Record<string, string>
): boolean => {
  if (!attributes || Object.keys(attributes).length === 0) return true;
  return Object.entries(attributes).every(
    ([name, value]) => element.getAttribute(name) === value
  );
};

const tagMatches = (element: Element, tagName: string): boolean =>
  element.tagName.toLowerCase() === tagName;

/**
 * Resolves one path segment as a direct child of `parent`, using the same
 * fields recorded when the path was generated (not querySelector).
 */
export const findChildForPathSegment = (
  parent: Element,
  item: ElementPath
): Element | null => {
  const children = Array.from(parent.children);

  if (item.id) {
    const byId = children.find(
      (child) => tagMatches(child, item.tagName) && child.id === item.id
    );
    if (byId) return byId;
  }

  if (item.attributes && Object.keys(item.attributes).length > 0) {
    const byAttributes = children.find(
      (child) =>
        tagMatches(child, item.tagName) &&
        attributesMatch(child, item.attributes) &&
        classNameMatches(child, item.className)
    );
    if (byAttributes) return byAttributes;
  }

  if (item.nthChild != null && item.nthChild >= 1) {
    const candidate = children[item.nthChild - 1];
    if (
      candidate &&
      tagMatches(candidate, item.tagName) &&
      (!item.id || candidate.id === item.id) &&
      attributesMatch(candidate, item.attributes)
    ) {
      return candidate;
    }
  }

  const matches = children.filter(
    (child) =>
      tagMatches(child, item.tagName) &&
      classNameMatches(child, item.className) &&
      attributesMatch(child, item.attributes)
  );

  return matches.length === 1 ? matches[0] : null;
};

export const resolveElementAtPathIndex = (
  iframe: HTMLIFrameElement,
  path: ElementPath[],
  index: number
): Element | null => {
  if (index < 0 || index >= path.length) return null;
  const doc = iframe.contentDocument;
  if (!doc?.body) return null;

  let current: Element = doc.body;

  for (let i = 0; i <= index; i++) {
    const child = findChildForPathSegment(current, path[i]);
    if (!child) return null;
    current = child;
  }

  return current;
};

/**
 * Creates a more specific selector by adding data attributes
 */
export const createSpecificSelector = (element: Element): string => {
  const selectors: string[] = [];

  // Try ID first
  if (element.id) {
    selectors.push(`#${element.id}`);
  }

  // Try data attributes
  const dataAttributes = ["data-testid", "data-cy", "data-test-id"];
  for (const attr of dataAttributes) {
    const value = element.getAttribute(attr);
    if (value) {
      selectors.push(`[${attr}="${value}"]`);
    }
  }

  // Try role attribute
  const role = element.getAttribute("role");
  if (role) {
    selectors.push(`[role="${role}"]`);
  }

  // Fallback to tag + class
  if (element.className && typeof element.className === "string") {
    const classes = element.className.split(" ").filter(Boolean);
    if (classes.length > 0) {
      selectors.push(`${element.tagName.toLowerCase()}.${classes.join(".")}`);
    }
  }

  return selectors[0] || element.tagName.toLowerCase();
};

/**
 * Validates if an element path is still valid in the current DOM
 */
export const validateElementPath = (
  path: ElementPath[],
  iframe: HTMLIFrameElement
): boolean => {
  try {
    const selector = path
      .map((item) => {
        let selector = item.tagName;

        if (item.id) {
          selector += `#${item.id}`;
        } else if (item.className) {
          const classes = item.className.split(" ").filter(Boolean);
          if (classes.length > 0) {
            selector += `.${classes.join(".")}`;
          }
        }

        if (item.nthChild && item.nthChild > 1) {
          selector += `:nth-child(${item.nthChild})`;
        }

        return selector;
      })
      .join(" > ");

    const element = iframe.contentDocument?.querySelector(selector);
    return element !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Gets all text content from an element and its children
 */
export const getElementTextContent = (element: Element): string => {
  return element.textContent?.trim() || "";
};

/**
 * Checks if an element is visible
 */
export const isElementVisible = (element: Element): boolean => {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    (element as HTMLElement).offsetWidth > 0 &&
    (element as HTMLElement).offsetHeight > 0
  );
};

/**
 * Gets the bounding rectangle of an element relative to the iframe
 */
export const getElementRect = (
  element: Element,
  iframe: HTMLIFrameElement
): DOMRect => {
  const rect = element.getBoundingClientRect();
  const iframeRect = iframe.getBoundingClientRect();

  return new DOMRect(
    rect.left + iframeRect.left,
    rect.top + iframeRect.top,
    rect.width,
    rect.height
  );
};
