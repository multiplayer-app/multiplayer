import { useCallback, useEffect, useRef } from "react";
import useShortcut from "shared/hooks/useShortcut";
import FlowDiagramEditor from "./FlowDiagram";
import { IFlow } from "@multiplayer/types";

interface UseFlowDiagramReturn {
  instance: FlowDiagramEditor;
  enable: () => void;
  disable: () => void;
}

interface UseFlowDiagramOptions extends IFlow { }

const useFlowDiagram = (options: UseFlowDiagramOptions): UseFlowDiagramReturn => {
  const editorRef = useEditorRef(options);
  const { shortcuts, listen, disable, enable } = useShortcut();

  useEffect(() => {
    const listeners: (() => void)[] = [];
    const handleSelectAll = () => editorRef.current?.selectAll();
    const handleDeselectAll = () => editorRef.current?.deselectAll();

    listeners.push(listen(shortcuts.esc, handleDeselectAll));
    listeners.push(listen(shortcuts.select_all, handleSelectAll));

    return () => {
      listeners.forEach((cleanup) => cleanup());
    };
  }, [listen, shortcuts]);

  useEffect(() => {
    return () => {
      editorRef.current?.destroy();
    };
  }, []);

  const enableEditor = useCallback(() => {
    if (!editorRef.current) return;
    enable();
    editorRef.current.enable();
  }, [enable]);

  const disableEditor = useCallback(() => {
    if (!editorRef.current) return;
    disable();
    editorRef.current.disable();
  }, [disable]);

  return {
    instance: editorRef.current,
    enable: enableEditor,
    disable: disableEditor,
  };
};

const useEditorRef = (options: UseFlowDiagramOptions) => {
  const editorRef = useRef<FlowDiagramEditor | null>(null);
  if (!editorRef.current) {
    editorRef.current = new FlowDiagramEditor(options);
  }
  return editorRef;
};

export default useFlowDiagram;
