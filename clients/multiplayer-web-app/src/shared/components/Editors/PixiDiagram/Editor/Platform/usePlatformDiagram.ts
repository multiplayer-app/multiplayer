import { useEventListener } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo } from "react";

import useShortcut from "shared/hooks/useShortcut";
import { EntityCategories } from "shared/models/enums";
import { EntityWithMeta } from "shared/models/interfaces";
import { useEntities } from "shared/providers/EntitiesContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";

import { DiagramEvents, EditorOptions, ToolType } from "../types";
import PlatformDiagram from "./PlatformDiagram";
import { EntityType, VisualizationType } from "@multiplayer/types";

export interface UsePlatformDiagramReturn {
  instance: PlatformDiagram;
  enable: () => void;
  undo: () => void;
  redo: () => void;
  disable: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  cutSelection: () => void;
  copySelection: () => void;
  groupSelection: () => void;
  removeSelection: () => void;
  ungroupSelection: () => void;
  setCurrentTool: (tool: ToolType) => void;
}

const usePlatformEditor = (options: EditorOptions): UsePlatformDiagramReturn => {
  const editorRef = useEditorRef(options);
  const { openAlertDialog } = useAlertDialog();
  const { shortcuts, listen, disable, enable } = useShortcut();
  const { entitiesFetching, entities, fetchEntitiesByType } = useEntities();

  const platformComponents = useMemo(() => {
    if (entitiesFetching) return null;
    return new Map<string, EntityWithMeta>(
      entities[EntityCategories.COMPONENT].map((e) => [e.entityId, e])
    );
  }, [entities, entitiesFetching]);

  const removeSelection = async () => {
    if (
      (!editorRef.selectedEdges.size &&
        !editorRef.selectedGroups.size &&
        !editorRef.selectedComponents.size) ||
      (options.visualizationType !== VisualizationType.TABLE &&
        !editorRef.enabled) ||
      editorRef.readonly
    ) return;

    const res = await openAlertDialog({
      title: "Are you sure you want to delete selected items?",
      description: "",
    });
    if (res) {
      editorRef.removeSelection();
    }
  };

  const undo = useCallback(() => options.undoManager.undo(), []);
  const redo = useCallback(() => options.undoManager.redo(), []);
  const copySelection = useCallback(() => editorRef.copySelection(), []);
  const cutSelection = useCallback(() => editorRef.cutSelection(), []);
  const groupSelection = useCallback(() => editorRef.groupSelection(), []);
  const ungroupSelection = useCallback(() => editorRef.ungroupSelection(), []);
  const selectAll = useCallback(() => editorRef.selectAll(), []);
  const deselectAll = useCallback(() => editorRef.deselectAll(), []);
  const setCurrentTool = useCallback((tool: ToolType) => editorRef.setCurrentTool(tool), []);

  const enableEditor = useCallback(() => {
    if (!editorRef) return;
    enable();
    editorRef.enable();
  }, [editorRef, enable]);

  const disableEditor = useCallback(() => {
    if (!editorRef) return;
    disable();
    editorRef.disable();
  }, [editorRef, disable]);

  useEffect(() => {
    editorRef.setPlatformComponents(platformComponents);
  }, [platformComponents, editorRef]);

  useEffect(() => {
    const listeners: (() => void)[] = [];

    listeners.push(listen(shortcuts.undo, undo));
    listeners.push(listen(shortcuts.redo, redo));
    listeners.push(listen(shortcuts.esc, deselectAll));
    listeners.push(listen(shortcuts.copy, copySelection));
    listeners.push(listen(shortcuts.select_all, selectAll));
    listeners.push(listen(shortcuts.group, groupSelection));
    listeners.push(listen(shortcuts.delete, removeSelection));
    listeners.push(listen(shortcuts.ungroup, ungroupSelection));
    listeners.push(listen(shortcuts.tool_hand, () => setCurrentTool(ToolType.HAND)));
    listeners.push(listen(shortcuts.tool_select, () => setCurrentTool(ToolType.SELECT)));

    return () => {
      listeners.forEach((cleanup) => cleanup());
    };
  }, [
    listen,
    shortcuts,
    undo,
    redo,
    selectAll,
    deselectAll,
    copySelection,
    groupSelection,
    removeSelection,
    ungroupSelection,
    setCurrentTool,
  ]);


  useEventListener("paste", editorRef.onPaste);

  useEffect(() => {
    const handleCheckEntities = async (entityIds: string[]) => {
      const res = await fetchEntitiesByType(EntityType.PLATFORM_COMPONENT, entityIds);
      const existingEntities = new Set(res.map((e) => e.entity.entityId));
      const missingEntities = new Set(entityIds.filter((id) => !existingEntities.has(id)));
      editorRef.cleanupMissingEntityComponents(missingEntities);
    };

    editorRef.on(DiagramEvents.check_entities, handleCheckEntities);
    return () => {
      editorRef.off(DiagramEvents.check_entities, handleCheckEntities);
    };
  }, [fetchEntitiesByType]);

  useEffect(() => {
    return () => {
      editorRef?.destroy();
    };
  }, []);

  return {
    instance: editorRef,
    enable: enableEditor,
    disable: disableEditor,
    undo,
    redo,
    selectAll,
    deselectAll,
    cutSelection,
    copySelection,
    setCurrentTool,
    groupSelection,
    removeSelection,
    ungroupSelection,
  };
};

const useEditorRef = (options: EditorOptions): PlatformDiagram => {
  return useMemo(() => new PlatformDiagram(options), []);
};

export default usePlatformEditor;
