import { useCallback, useEffect, useState } from "react";

import { isInputElement } from "shared/utils";

const TOGGLE_SHORTCUT_LABEL = "Ctrl+.";

const TAB_COUNT = 3;

function clampTab(i: number) {
  return Math.min(TAB_COUNT - 1, Math.max(0, Math.floor(i)));
}

export function useAgentSessionSidePanel(options: {
  enabled: boolean;
  defaultOpen: boolean;
}) {
  const { enabled, defaultOpen } = options;
  const [sidePanelOpen, setSidePanelOpenState] = useState(defaultOpen);
  const [sidePanelTab, setSidePanelTabState] = useState(0);

  const setSidePanelOpen = useCallback(
    (updater: boolean | ((prev: boolean) => boolean)) => {
      setSidePanelOpenState((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    []
  );

  const setSidePanelTab = useCallback((tab: number) => {
    setSidePanelTabState(clampTab(tab));
  }, []);

  const toggleSidePanel = useCallback(() => {
    setSidePanelOpen((open) => !open);
  }, [setSidePanelOpen]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "." || e.repeat) return;
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      if (isInputElement(el)) return;

      e.preventDefault();
      setSidePanelOpen((open) => !open);
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, setSidePanelOpen]);

  return {
    sidePanelOpen,
    setSidePanelOpen,
    sidePanelTab,
    setSidePanelTab,
    toggleSidePanel,
    toggleShortcutLabel: TOGGLE_SHORTCUT_LABEL,
  };
}
