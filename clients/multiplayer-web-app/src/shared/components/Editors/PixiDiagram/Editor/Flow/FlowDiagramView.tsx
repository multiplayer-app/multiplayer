import { Box, useColorMode } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import { useEntities } from "shared/providers/EntitiesContext";

import type { FlowDiagram } from "..";
import { ViewportState } from "../types";
import { DEFAULT_ZOOM } from "../configs";
import ZoomControls from "../../ZoomControls/ZoomControls";

interface FlowDiagramProps {
  editor: FlowDiagram;
}

const FlowDiagramView = ({ editor }: FlowDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();
  const { entityAliasesMap } = useEntities();
  const [viewportState, setViewportState] =
    useState<ViewportState>(DEFAULT_ZOOM);

  useEffect(() => {
    editor.setPlatformComponents(entityAliasesMap);
  }, [editor, entityAliasesMap]);

  useEffect(() => {
    editor.setRendererViewContainer(containerRef.current);
    return () => {
      editor.ticker.destroy();
    };
  }, [editor]);

  useEffect(() => {
    editor.setColorMode(colorMode === "dark");
  }, [colorMode, editor]);

  return (
    <Box
      flex="1"
      h="full"
      overflow="hidden"
      ref={containerRef}
      position="relative"
      userSelect="none"
      css={{
        touchAction: "none",
        canvas: {
          width: "100%",
          height: "100%",
          background: "var(--chakra-colors-bg-primary)",
        },
      }}
    >
      <ZoomControls
        viewport={editor.viewport}
        viewportState={viewportState}
        onChange={setViewportState}
      />
    </Box>
  );
};

export default FlowDiagramView;
