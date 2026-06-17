import { useCallback, useEffect, useRef } from "react";
import { isInputElement } from "shared/utils";
import shortcuts, { IShortcuts, IShortcut } from "shared/configs/shortcuts.config";

type ShortcutCallback = (event: KeyboardEvent) => void;

interface IUseShortcut {
  listen: (action: any, callback: ShortcutCallback) => () => void;
  disable: () => void;
  enable: () => void;
  shortcuts: IShortcuts;
}

const useShortcut = (): IUseShortcut => {
  const state = useRef({ enabled: true });
  const listenersRef = useRef<Map<any, Set<ShortcutCallback>>>(new Map());

  const disable = useCallback(() => {
    state.current.enabled = false;
  }, []);

  const enable = useCallback(() => {
    state.current.enabled = true;
  }, []);

  const _checkShortcut = useCallback((e: KeyboardEvent, shortcut: IShortcut) => {
    const { keyCode, ctrlKey, metaKey, shiftKey, altKey } = e;
    return shortcut.keys.some(
      (key) =>
        keyCode === key.keyCode &&
        ctrlKey === !!key.ctrlKey &&
        metaKey === !!key.metaKey &&
        shiftKey === !!key.shiftKey &&
        altKey === !!key.altKey
    );
  }, []);

  const _findShortcut = useCallback((e: KeyboardEvent): IShortcut | undefined => {
    return Object.values(shortcuts).find((shortcut) => _checkShortcut(e, shortcut));
  }, [_checkShortcut]);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    const targetElement = e.target as HTMLElement;
    const isModalOpened = !!document.querySelector(
      "body > .chakra-portal .chakra-modal__overlay"
    );
    const isInput = isInputElement(targetElement);
    const shortcut = _findShortcut(e);

    if (
      !shortcut ||
      isInput ||
      isModalOpened ||
      (!shortcut.repeat && e.repeat) ||
      (shortcut.condition && shortcut.condition(e))
    ) {
      return;
    }

    if (state.current.enabled) {
      const callbacks = listenersRef.current.get(shortcut);
      callbacks?.forEach((cb) => cb(e));
      e.preventDefault();
      e.stopPropagation();
    }
  }, [_findShortcut]);

  const listen = useCallback((action: any, callback: (e: KeyboardEvent) => void) => {
    if (!listenersRef.current.has(action)) {
      listenersRef.current.set(action, new Set());
    }
    const callbacks = listenersRef.current.get(action)!;
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        listenersRef.current.delete(action);
      }
    };
  }, []);


  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [handleKeydown]);

  return { listen, disable, enable, shortcuts };
};

export default useShortcut;
