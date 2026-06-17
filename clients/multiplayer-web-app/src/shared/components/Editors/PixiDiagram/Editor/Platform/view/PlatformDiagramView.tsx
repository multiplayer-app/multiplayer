import { Box, useColorMode } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  TrashOIcon,
  AddViewIcon,
  SidebarIcon,
  DuplicateIcon,
  AddComponentIcon,
  GroupComponentsIcon,
  UngroupComponentsIcon,
} from "shared/icons";
import { ToolbarButton } from "shared/components/Toolbar";
import FloatingToolbar from "shared/components/FloatingToolbar";
import { useActiveTabState } from "shared/providers/TabsContext";

import { DEFAULT_ZOOM } from "../../configs";
import { DiagramEvents, ViewportState } from "../../types";
import { UsePlatformDiagramReturn } from "../usePlatformDiagram";

import ZoomControls from "../../../ZoomControls/ZoomControls";
import PixiTooltipOverlay from "./PixiTooltipOverlay";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface PlatformDiagramProps {
  editor: UsePlatformDiagramReturn;
  showToolbar?: boolean;
  keepViewportState?: boolean;
  readonly?: boolean;
  onOpenDetails?: (node) => void;
  onAddView?: () => void;
  onAddComponent?: () => void;
}

const PlatformDiagramView = ({
  editor,
  showToolbar,
  keepViewportState,
  readonly,
  ...rest
}: PlatformDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();
  const [tabState, setTabState] = useActiveTabState<{
    viewport: ViewportState;
  }>();

  const viewportState = useMemo(() => {
    return (keepViewportState && tabState && tabState.viewport) || DEFAULT_ZOOM;
  }, [tabState]);

  useEffect(() => {
    editor.instance.setViewport(tabState?.viewport);
    editor.instance.setRendererViewContainer(containerRef.current);
    return () => {
      editor.instance.ticker.destroy();
    };
  }, [editor.instance]);

  useEffect(() => {
    editor.instance.setColorMode(colorMode === "dark");
  }, [colorMode, editor.instance]);

  return (
    <Box
      flex="1"
      h="full"
      overflow="hidden"
      ref={containerRef}
      position="relative"
      userSelect="none"
      __css={{
        touchAction: "none",
        canvas: { width: "100%", height: "100%", background: "var(--chakra-colors-bg-primary)" },
      }}
    >
      <ZoomControls
        viewport={editor.instance.viewport}
        viewportState={viewportState}
        onChange={(viewport) =>
          keepViewportState &&
          setTabState &&
          setTabState((prev) => ({ ...prev, viewport }))
        }
      />
      <PixiTooltipOverlay parentRef={containerRef} />
      {showToolbar && <Toolbar editor={editor} {...rest} />}
    </Box>
  );
};

const Toolbar = ({
  editor,
  onAddView,
  onOpenDetails,
  onAddComponent,
}: PlatformDiagramProps) => {
  const { instance } = editor;
  const { isSandbox } = useProjectSandbox();

  const [selectedInstances, setSelectedInstances] = useState({
    components: [],
    groups: [],
  });

  useEffect(() => {
    const onSelectionChange = (components, groups) => {
      setSelectedInstances({ components, groups });
    };
    instance.on(DiagramEvents.selection_done, onSelectionChange);
    return () => {
      instance.off(DiagramEvents.selection_done, onSelectionChange);
    };
  }, [instance]);

  const { components, groups } = selectedInstances;
  const totalLength = components.length + groups.length;

  const groupNodes = useMemo(
    () => groups.map((id) => instance.groupsRefs.get(id)).filter(Boolean),
    [groups, instance.groupsRefs]
  );

  const componentNodes = useMemo(
    () =>
      components.map((id) => instance.componentsRefs.get(id)).filter(Boolean),
    [components, instance.componentsRefs]
  );

  if (totalLength === 0) {
    return null;
  }

  const selectedGroup = groups.length === 1 ? groupNodes[0] : null;
  const selectedComponent = components.length === 1 ? componentNodes[0] : null;
  const selectedInstance =
    totalLength === 1 ? selectedComponent || selectedGroup : null;
  const hasGroupedComponent = componentNodes.some(
    (component) => component.groupId
  );

  if (isSandbox) {
    return;
  }

  return (
    <FloatingToolbar>
      <ToolbarButton
        icon={<AddComponentIcon />}
        label="Add Components"
        onClick={onAddComponent}
      />

      <ToolbarButton
        icon={<AddViewIcon />}
        label="Create a view"
        onClick={onAddView}
      />

      {hasGroupedComponent && (
        <ToolbarButton
          icon={<UngroupComponentsIcon />}
          label="Remove selection from group"
          onClick={editor.ungroupSelection}
        />
      )}

      {components.length > 0 && (
        <ToolbarButton
          icon={<GroupComponentsIcon />}
          label="Create group with selection"
          onClick={editor.groupSelection}
        />
      )}

      {selectedInstance && (
        <ToolbarButton
          icon={<SidebarIcon />}
          label="Show details"
          onClick={() => onOpenDetails(selectedInstance)}
        />
      )}

      <ToolbarButton
        icon={<DuplicateIcon />}
        label="Copy selection"
        onClick={editor.copySelection}
      />

      <ToolbarButton
        icon={<TrashOIcon />}
        label="Remove selection"
        onClick={editor.removeSelection}
      />
    </FloatingToolbar>
  );
};

// Copy / Paste / Create group with selection / Remove selection from group /  Show (component / group) details

export default PlatformDiagramView;
