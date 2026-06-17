export const INSPECTOR_HIGHLIGHT_HOVER_ID = "mp-inspector-highlight-hover";
export const INSPECTOR_HIGHLIGHT_SELECTED_ID =
  "mp-inspector-highlight-selected";

const HIGHLIGHT_IDS = [
  INSPECTOR_HIGHLIGHT_HOVER_ID,
  INSPECTOR_HIGHLIGHT_SELECTED_ID,
  /** @deprecated legacy single highlight id */
  "mp-inspector-highlight",
];

export const removeInspectorHighlights = (doc: Document | null | undefined) => {
  if (!doc) return;
  HIGHLIGHT_IDS.forEach((id) => {
    doc.getElementById(id)?.remove();
  });
};

export const upsertInspectorHighlight = (
  iframe: HTMLIFrameElement,
  element: Element,
  variant: "hover" | "selected"
) => {
  const doc = iframe.contentDocument;
  if (!doc?.body) return;

  const id =
    variant === "hover"
      ? INSPECTOR_HIGHLIGHT_HOVER_ID
      : INSPECTOR_HIGHLIGHT_SELECTED_ID;

  doc.getElementById(id)?.remove();

  const rect = element.getBoundingClientRect();
  const highlight = doc.createElement("div");
  highlight.id = id;
  highlight.style.cssText =
    variant === "hover"
      ? `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px dashed #007acc;
        background-color: rgba(0, 122, 204, 0.12);
        pointer-events: none;
        z-index: 10000000000000;
        box-sizing: border-box;
      `
      : `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid #007acc;
        background-color: rgba(0, 122, 204, 0.25);
        pointer-events: none;
        z-index: 10000000000001;
        box-sizing: border-box;
      `;

  doc.body.appendChild(highlight);
};
