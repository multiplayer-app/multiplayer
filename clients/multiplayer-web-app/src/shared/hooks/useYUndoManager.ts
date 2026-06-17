import * as Y from "yjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { UndoManagerOptions } from "yjs/dist/src/internals";

const useYUndoManager = (
  scope?: Y.AbstractType<any>[], //Y.AbstractType<any> |
  options?: UndoManagerOptions
): UseUndoManagerReturn => {
  const undoManager = useRef<Y.UndoManager>(
    scope[0]?.doc && new Y.UndoManager(scope, options)
  );
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    return () => {
      undoManager.current?.destroy();
    };
  }, []);

  const undo = useCallback(() => {
    if (undoManager.current?.canUndo()) {
      undoManager.current.undo();
    }
  }, []);

  const redo = useCallback(() => {
    if (undoManager.current?.canRedo()) {
      undoManager.current.redo();
    }
  }, []);

  const clear = useCallback(() => {
    undoManager.current?.clear();
  }, []);

  const destroy = useCallback(() => {
    undoManager.current?.destroy();
  }, []);

  const setupListeners = useCallback(() => {
    if (!undoManager.current) return;

    const updateState = (e) => {
      setCanUndo(undoManager.current.canUndo());
      setCanRedo(undoManager.current.canRedo());
    };

    undoManager.current.on("stack-cleared", updateState);
    undoManager.current.on("stack-item-added", updateState);
    undoManager.current.on("stack-item-popped", updateState);
    undoManager.current.on("stack-item-updated", updateState);
  }, []);

  const init = useCallback(
    (
      scope: Y.AbstractType<any> | Y.AbstractType<any>[],
      options?: UndoManagerOptions
    ) => {
      if (!undoManager.current) {
        undoManager.current = new Y.UndoManager(scope, options);
        setupListeners();
      }
      return undoManager.current;
    },
    []
  );

  useEffect(() => {
    setupListeners();
  }, []);

  return {
    init,
    destroy,
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    instance: undoManager,
  };
};

export interface UseUndoManagerReturn {
  instance: React.MutableRefObject<Y.UndoManager>;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  destroy: () => void;
  init: (
    scope: Y.AbstractType<any> | Y.AbstractType<any>[],
    options?: UndoManagerOptions
  ) => Y.UndoManager;
}

export default useYUndoManager;
