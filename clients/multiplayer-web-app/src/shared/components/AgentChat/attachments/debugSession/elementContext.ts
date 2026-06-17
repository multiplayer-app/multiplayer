import { formatTime } from "pages/Workspace/Project/Debugger/DebugSession/utils";

import type { ElementPath } from "pages/Workspace/Project/Debugger/DebugSession/DebugSessionRecording/DebugSessionPlayer/ReplayerOverlay/ElementInspector";

import { ELEMENT_KIND } from "../kinds";

export const ELEMENT_ATTACHMENT_SUMMARY =
  "DOM element selected in the session recording at the attached playback timestamp. Includes selector, attributes, computed styles, and layout.";

export interface DebugSessionElementData {
  debugSessionId: string;
  debugSessionName?: string;
  debugSessionUrl?: string;
  timestampMs: number;
  relativeTime: string;
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  attributes: { name: string; value: string }[];
  computedStyles: Record<string, string>;
  rect: { width: number; height: number; left: number; top: number };
  path: ElementPath[];
  message?: string;
}

const IMPORTANT_STYLES = [
  "display",
  "position",
  "width",
  "height",
  "margin",
  "padding",
  "border",
  "background",
  "color",
  "font-size",
  "font-weight",
  "text-align",
  "overflow",
  "z-index",
];

export const formatElementSelector = (path: ElementPath[]): string =>
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

export const getElementComputedStyles = (
  el: Element
): Record<string, string> => {
  try {
    const styles = window.getComputedStyle(el);
    return IMPORTANT_STYLES.reduce(
      (acc, style) => {
        const value = styles.getPropertyValue(style);
        if (value && value !== "initial" && value !== "normal") {
          acc[style] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );
  } catch {
    return {};
  }
};

export const getElementAttachmentName = (
  tagName: string,
  id?: string,
  className?: string
) => {
  const tag = tagName.toLowerCase();
  if (id) return `${tag}#${id}`;
  const firstClass = className?.split(" ").filter(Boolean)[0];
  if (firstClass) return `${tag}.${firstClass}`;
  return tag;
};

export const serializeElement = (
  element: Element,
  elementPath: ElementPath[]
): Omit<
  DebugSessionElementData,
  "debugSessionId" | "debugSessionName" | "debugSessionUrl" | "timestampMs" | "relativeTime" | "message"
> => {
  const selector = formatElementSelector(elementPath);
  let rect: DOMRect;
  try {
    rect = element.getBoundingClientRect();
  } catch {
    rect = new DOMRect(0, 0, 0, 0);
  }

  const className =
    typeof element.className === "string" ? element.className : undefined;

  return {
    selector,
    tagName: element.tagName?.toLowerCase() || "unknown",
    id: element.id || undefined,
    className,
    textContent: (element.textContent || "").trim().slice(0, 500) || undefined,
    attributes: Array.from(element.attributes).map((attr) => ({
      name: attr.name,
      value: String(attr.value ?? ""),
    })),
    computedStyles: getElementComputedStyles(element),
    rect: {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    },
    path: elementPath,
  };
};

export const buildElementContext = ({
  debugSessionId,
  debugSessionName,
  debugSessionUrl,
  timestampMs,
  element,
  elementPath,
  message,
}: {
  debugSessionId: string;
  debugSessionName?: string;
  debugSessionUrl?: string;
  timestampMs: number;
  element: Element;
  elementPath: ElementPath[];
  message?: string;
}) => {
  const relativeTime = formatTime(timestampMs);
  const serialized = serializeElement(element, elementPath);
  const name = getElementAttachmentName(
    serialized.tagName,
    serialized.id,
    serialized.className
  );

  return {
    kind: ELEMENT_KIND,
    name,
    title: name,
    summary: ELEMENT_ATTACHMENT_SUMMARY,
    url: debugSessionUrl,
    data: {
      debugSessionId,
      debugSessionName,
      debugSessionUrl,
      timestampMs: Math.floor(Math.max(timestampMs, 0)),
      relativeTime,
      message: message?.trim() || undefined,
      ...serialized,
    } satisfies DebugSessionElementData,
  };
};
