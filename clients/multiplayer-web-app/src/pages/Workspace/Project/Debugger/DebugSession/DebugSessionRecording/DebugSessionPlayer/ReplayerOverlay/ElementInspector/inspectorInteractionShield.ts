const INSPECTOR_ROOT_CLASS = "mp-inspector-active";

/** Block default DOM behavior; use capture so targets never receive the event. */
const SHIELDED_EVENT_TYPES = [
  "click",
  "dblclick",
  "auxclick",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
  "contextmenu",
  "focusin",
  "focus",
  "keydown",
  "keypress",
  "keyup",
  "submit",
  "change",
  "input",
  "touchstart",
  "touchend",
  "dragstart",
  "drop",
  "selectstart",
] as const;

export interface InspectorInteractionHandlers {
  onMouseMove: (event: MouseEvent) => void;
  /** Primary-button press — must run on pointerdown/mousedown; click is suppressed by the shield. */
  onPick: (event: MouseEvent) => void;
}

const applyInspectorDocumentStyles = (doc: Document, active: boolean) => {
  const root = doc.documentElement;
  if (!root) return;

  if (active) {
    root.classList.add(INSPECTOR_ROOT_CLASS);
    root.style.cursor = "crosshair";
    if (doc.body) {
      doc.body.style.userSelect = "none";
      doc.body.style.webkitUserSelect = "none";
    }
    return;
  }

  root.classList.remove(INSPECTOR_ROOT_CLASS);
  root.style.cursor = "";
  if (doc.body) {
    doc.body.style.userSelect = "";
    doc.body.style.webkitUserSelect = "";
  }
};

export const attachInspectorInteractionShield = (
  doc: Document,
  handlers: InspectorInteractionHandlers
): (() => void) => {
  applyInspectorDocumentStyles(doc, true);

  const onMouseMove = (event: MouseEvent) => {
    handlers.onMouseMove(event);
  };

  const onPick = (event: Event) => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0) return;
    handlers.onPick(mouseEvent);
  };

  const shieldCapture = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const pickEvent = "PointerEvent" in (doc.defaultView ?? window)
    ? "pointerdown"
    : "mousedown";

  doc.addEventListener("mousemove", onMouseMove, true);
  doc.addEventListener(pickEvent, onPick, true);

  SHIELDED_EVENT_TYPES.forEach((type) => {
    doc.addEventListener(type, shieldCapture, true);
  });

  return () => {
    doc.removeEventListener("mousemove", onMouseMove, true);
    doc.removeEventListener(pickEvent, onPick, true);
    SHIELDED_EVENT_TYPES.forEach((type) => {
      doc.removeEventListener(type, shieldCapture, true);
    });
    applyInspectorDocumentStyles(doc, false);
  };
};
