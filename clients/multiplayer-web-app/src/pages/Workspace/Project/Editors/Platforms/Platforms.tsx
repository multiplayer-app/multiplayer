import { Button, Flex, useDisclosure } from "@chakra-ui/react";
import {
  memo,
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Platform,
  EntityType,
  EdgeDirection,
  VisualizationType,
} from "@multiplayer/types";

import { ChangesViewMode } from "shared/models/enums";
import { IEditorProps } from "shared/models/interfaces";
import useDiagramBoard from "shared/hooks/useDiagramBoard";
import {
  FullScreenContainer,
  FullScreenContentContainer,
} from "shared/providers/FullScreenContext";

import { useYDoc } from "shared/hooks/useYDoc";
import useYMapState from "shared/hooks/useYMapState";
import useYUndoManager from "shared/hooks/useYUndoManager";
import { useVersion } from "shared/providers/VersionContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import { DiagramStateProvider } from "shared/providers/DiagramContext";
import {
  DiagramEvents,
  usePlatformDiagram,
  PlatformDiagramView,
} from "shared/components/Editors/PixiDiagram";
import EntityEmptyView from "shared/components/EntityEmptyView";
import EntityDetailsDrawer from "shared/components/EntityDetailsDrawer";
import EntityThreadsDrawer from "shared/components/EntityThreadsDrawer";
import AddComponentModal from "shared/components/AddComponentModal";
import { ComponentDetailsDrawer } from "shared/components/PlatformComponents";
import { CAPTURE_TIMEOUT } from "shared/components/Editors/PixiDiagram/Editor/configs";
import GroupNode from "shared/components/Editors/PixiDiagram/Editor/components/GroupNode";
import type ComponentNode from "shared/components/Editors/PixiDiagram/Editor/components/ComponentNode";

import TableBoard from "./TableBoard";
import ViewsDrawer from "./ViewsDrawer";
import PlatformsToolbar from "./PlatformsToolbar";
import GroupDetailsDrawer from "./GroupDetailsDrawer";

import "./Platforms.scss";

interface IPlatformsProps extends IEditorProps<Platform> {
  isSystemMap?: boolean;
}

export const Platforms = forwardRef(
  (
    {
      doc: yDoc,
      provider,
      readonly,
      initialData,
      isSystemMap,
    }: IPlatformsProps,
    ref
  ) => {
    const sourceName = isSystemMap ? "system map" : "platform";
    const { currentBranchId } = useVersion();
    const viewsDrawerDisclosure = useDisclosure();
    const entityThreadsDisclosure = useDisclosure();
    const componentsModalDisclosure = useDisclosure();
    const propertiesDrawerDisclosure = useDisclosure();
    const groupDetailsDrawerDisclosure = useDisclosure();
    const componentDetailsDrawerDisclosure = useDisclosure();
    const [viewMode, setViewMode] = useState(ChangesViewMode.NONE);
    const [renamingView, setRenamingView] = useState(null);
    const [visualizationType, setVisualizationType] =
      useState<VisualizationType>(VisualizationType.DIAGRAM);
    const [activeGroup, setActiveGroup] = useState<GroupNode | null>(null);
    const [activeComponent, setActiveComponent] =
      useState<ComponentNode | null>(null);
    const doc = useYDoc(EntityType.PLATFORM, yDoc, initialData);
    const undoManager = useYUndoManager([doc.getMap("object")], {
      captureTimeout: CAPTURE_TIMEOUT,
    });

    const [nameMap] = useYMapState<{ name: string }>(doc.getMap("name"));

    const sourceNodeRef = useRef<{
      id: string;
      direction: EdgeDirection;
      shouldConnectToParent: boolean;
    } | null>(null);

    const editor = usePlatformDiagram({
      doc,
      provider,
      readonly,
      undoManager,
      visualizationType,
    });

    const { actions, loading, state, isReadonly } = useDiagramBoard({
      doc,
      provider,
      readonly,
      viewMode,
    });

    const addComponents = (ids: string[]) => {
      editor.instance.addComponents(ids, sourceNodeRef.current);
    };

    const onComponentsModalClose = () => {
      componentsModalDisclosure.onClose();
    };

    const openDetailsDrawer = (node) => {
      propertiesDrawerDisclosure.onClose();
      if (node instanceof GroupNode) {
        setActiveGroup(node);
        groupDetailsDrawerDisclosure.onOpen();
      } else {
        setActiveComponent(node);
        componentDetailsDrawerDisclosure.onOpen();
      }
    };

    const openComponentsListModal = (
      id?: string,
      direction?: EdgeDirection,
      shouldConnectToParent?: boolean
    ) => {
      if (direction) {
        sourceNodeRef.current = { id, direction, shouldConnectToParent };
      } else {
        sourceNodeRef.current = null;
      }
      componentsModalDisclosure.onOpen();
    };

    const changeVisualizationType = (type) => {
      setVisualizationType(type);
      const visTypeMap = JSON.parse(
        localStorage.getItem("viewToVisTypeMap") || "{}"
      );

      const platformViewMap = visTypeMap[provider.entityId] || {};
      platformViewMap[state.currentViewId] = type;

      localStorage.setItem(
        "viewToVisTypeMap",
        JSON.stringify({
          ...visTypeMap,
          [provider.entityId]: platformViewMap,
        })
      );
    };

    useImperativeHandle(ref, () => ({
      getEditorInstance: () => {
        return editor.instance;
      },
    }));

    useEffect(() => {
      editor.instance.setCurrentViewId(state.currentViewId);
    }, [editor.instance, state.currentViewId]);

    useEffect(() => {
      editor.instance.setViewMode(viewMode);
    }, [editor.instance, viewMode]);

    useEffect(() => {
      editor.instance.setBaseContent(state.baseContent);
    }, [editor.instance, state.baseContent]);

    useEffect(() => {
      const handleAddNode = (node, direction) => {
        openComponentsListModal(node.data.id, direction, true);
      };

      const handleOpenNode = (node) => {
        openDetailsDrawer(node);
      };

      const onSelectionDone = (nodes, groups, edges) => {
        actions.onSelectionDone(nodes, groups, edges);
      };

      editor.instance.on(DiagramEvents.add_node, handleAddNode);
      editor.instance.on(DiagramEvents.open_node, handleOpenNode);
      editor.instance.on(DiagramEvents.selection_done, onSelectionDone);

      return () => {
        editor.instance.off(DiagramEvents.add_node, handleAddNode);
        editor.instance.off(DiagramEvents.open_node, handleOpenNode);
        editor.instance.off(DiagramEvents.selection_done, onSelectionDone);
      };
    }, [editor.instance, actions]);

    useEffect(() => {
      if (visualizationType === VisualizationType.DIAGRAM) {
        editor.enable();
      } else {
        editor.disable();
      }
    }, [editor, visualizationType]);

    useEffect(() => {
      if (componentsModalDisclosure.isOpen) {
        editor.disable();
      } else {
        editor.enable();
        sourceNodeRef.current = null;
      }
    }, [componentsModalDisclosure.isOpen]);

    useEffect(() => {
      provider?.awareness.setLocalStateField(
        "focusedElement",
        activeComponent ? activeComponent.id : null
      );
    }, [activeComponent]);

    useEffect(() => {
      if (!provider) return;
      provider.awareness.setLocalStateField(
        "visualizationType",
        visualizationType
      );
    }, [provider, visualizationType]);

    const onViewRename = (id) => {
      setRenamingView(id);
      viewsDrawerDisclosure.onOpen();
    };

    useEffect(() => {
      if (!provider) return;
      const localType = localStorage.getItem("viewToVisTypeMap");
      const localTypeObj = JSON.parse(localType || "{}");
      const platformViewMap = localTypeObj[provider.entityId] || {};
      setVisualizationType(
        platformViewMap[state.currentViewId] || VisualizationType.DIAGRAM
      );
    }, [state.currentViewId, provider?.entityId]);

    const isEmpty = !(state.nodes.size || state.groups.size);
    return (
      <FullScreenContainer direction="column" minH="full" flex="1">
        <DiagramStateProvider state={{ ...state, viewMode }} actions={actions}>
          <ThreadsProvider
            branchId={currentBranchId}
            objectId={provider?.entityId}
          >
            <PlatformsToolbar
              editor={editor.instance}
              isEmpty={isEmpty}
              sourceName={sourceName}
              showVisualizationTypeMenu={!isSystemMap}
              isReadonly={isReadonly}
              undoManager={undoManager}
              changesViewMode={viewMode}
              setChangesViewMode={setViewMode}
              onViewRename={onViewRename}
              visualizationType={visualizationType}
              viewsDrawerDisclosure={viewsDrawerDisclosure}
              entityThreadsDisclosure={entityThreadsDisclosure}
              changeVisualizationType={changeVisualizationType}
              componentsModalDisclosure={componentsModalDisclosure}
              propertiesDrawerDisclosure={propertiesDrawerDisclosure}
            />
            <FullScreenContentContainer flex="1" minH="0" position="relative">
              {viewsDrawerDisclosure.isOpen && (
                <ViewsDrawer
                  editor={editor}
                  readonly={isReadonly}
                  renamingView={renamingView}
                  onClose={viewsDrawerDisclosure.onClose}
                />
              )}
              <Flex flex="1" position="relative" overflow="hidden">
                {visualizationType === VisualizationType.DIAGRAM ? (
                  <PlatformDiagramView
                    editor={editor}
                    readonly={isReadonly}
                    showToolbar={!componentDetailsDrawerDisclosure.isOpen}
                    keepViewportState={true}
                    onAddView={actions.onViewCreate}
                    onOpenDetails={openDetailsDrawer}
                    onAddComponent={openComponentsListModal}
                  />
                ) : (
                  <TableBoard editor={editor} readonly={readonly} />
                )}

                {isEmpty && !loading && (
                  <EntityEmptyView
                    title="This platform view is currently empty"
                    description="A platform is a collection of components (web-apps, microservices, SaaS providers, etc.)"
                    position="absolute"
                    inset="0"
                    zIndex="10"
                    bg="bg.primary"
                  >
                    {!readonly && (
                      <Button mt="5" onClick={componentsModalDisclosure.onOpen}>
                        Add components
                      </Button>
                    )}
                  </EntityEmptyView>
                )}
              </Flex>
              {componentDetailsDrawerDisclosure.isOpen && (
                <ComponentDetailsDrawer
                  readonly={readonly}
                  onClose={componentDetailsDrawerDisclosure.onClose}
                  preSelectedComponentId={activeComponent.linkedTo}
                />
              )}

              {groupDetailsDrawerDisclosure.isOpen && (
                <GroupDetailsDrawer
                  doc={doc}
                  groupId={activeGroup.id}
                  onClose={groupDetailsDrawerDisclosure.onClose}
                />
              )}

              {componentsModalDisclosure.isOpen && (
                <AddComponentModal
                  sourceName={sourceName}
                  disclosure={componentsModalDisclosure}
                  onComponentsImport={addComponents}
                  onClose={onComponentsModalClose}
                />
              )}

              {entityThreadsDisclosure.isOpen && (
                <EntityThreadsDrawer
                  onClose={entityThreadsDisclosure.onClose}
                  entityType={EntityType.PLATFORM}
                />
              )}

              {propertiesDrawerDisclosure.isOpen && (
                <EntityDetailsDrawer
                  entityId={provider.entityId}
                  entityName={nameMap.name}
                  entityType={EntityType.PLATFORM}
                  onClose={() => propertiesDrawerDisclosure.onClose()}
                />
              )}
            </FullScreenContentContainer>
          </ThreadsProvider>
        </DiagramStateProvider>
      </FullScreenContainer>
    );
  }
);

export default memo(Platforms);
