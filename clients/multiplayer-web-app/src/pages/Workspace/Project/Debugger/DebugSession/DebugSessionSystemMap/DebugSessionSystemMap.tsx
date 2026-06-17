import { useEffect, useMemo, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import {
  Edge,
  Platform,
  OtelScope,
  Component,
  ComponentType,
} from "@multiplayer/types";
import { PlatformTemplates } from "@multiplayer/entity";

import { EntityWithMeta } from "shared/models/interfaces";
import { useEntities } from "shared/providers/EntitiesContext";
import { getTraceResource } from "shared/helpers/debugger.helpers";
import PlatformEditor, {
  PlatformEditorRef,
} from "shared/components/Editors/PlatformEditor/PlatformEditor";

import { useDebugSession } from "../DebugSessionContext";
import { DebugSessionNodeType, IDebugSessionNode, ITraceNode } from "../types";
import { useDebugSessionLayout } from "../DebugSessionLayoutContext";
import PageLoading from "shared/components/PageLoading";

const DebugSessionSystemMap = () => {
  const { sessionNodes, tracesLoading } = useDebugSession();
  const platformEditorRef = useRef<PlatformEditorRef>(null);
  const { playerWrapper, configs, playerContainer } = useDebugSessionLayout();
  const { entityAliasesMap } = useEntities();

  const platformData = useMemo(() => {
    if (
      !sessionNodes ||
      !sessionNodes[DebugSessionNodeType.Trace] ||
      tracesLoading
    ) {
      return null;
    }
    const traces = sessionNodes[DebugSessionNodeType.Trace] as any[];
    const components: Record<string, Component> = {};
    const edges: Record<string, Edge> = {};

    const extractServicesAndDependencies = (
      traces: IDebugSessionNode<ITraceNode>[],
      parentComponent?: Component
    ) => {
      traces.forEach((traceNode) => {
        const component = getTraceComponent(traceNode, entityAliasesMap);
        if (component) {
          components[component.id] = component;
          if (parentComponent && parentComponent.id !== component.id) {
            const edge = {
              id: `${parentComponent.id}_${component.id}`,
              source: parentComponent.id,
              target: component.id,
            };
            edges[edge.id] = edge;
          }
        }

        if (traceNode.childSpans) {
          extractServicesAndDependencies(traceNode.childSpans, component);
        }
      });
    };

    extractServicesAndDependencies(traces);

    const platform: Partial<Platform> = PlatformTemplates.empty();
    platform.edges = edges;
    platform.components = components;

    return platform;
  }, [sessionNodes, entityAliasesMap, tracesLoading]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const zoomToFit = () => {
      if (platformEditorRef.current) {
        clearTimeout(timeout);
        timeout = setTimeout(() => platformEditorRef.current.zoomToFit(), 300);
      }
    };
    const resizeObserver = new ResizeObserver(() => {
      zoomToFit();
    });

    zoomToFit();
    resizeObserver.observe(playerWrapper.current);
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Flex
      ref={playerWrapper}
      w="full"
      flex="1"
      direction="column"
      border="solid 1px"
      borderRadius="lg"
      position="relative"
      borderColor="border.primary"
      minW={configs.isListView ? "500px" : "0"}
      overflow="hidden"
    >
      {tracesLoading ? (
        <PageLoading />
      ) : platformData ? (
        <Box position="absolute" inset="0" ref={playerContainer}>
          <PlatformEditor
            ref={platformEditorRef}
            readonly={true}
            keepViewportState={true}
            initialData={platformData as Platform}
          />
        </Box>
      ) : (
        <Flex flex="1" justifyContent="center" alignItems="center">
          <Text>No platform data</Text>
        </Flex>
      )}
    </Flex>
  );
};

const getTraceComponent = (
  node: IDebugSessionNode<ITraceNode>,
  entityAliasesMap: Map<string, EntityWithMeta>
): Component | null => {
  const trace = node.meta;

  switch (trace.ScopeName) {
    case OtelScope.multiplayerNotebookHttp:
    case OtelScope.documentLoad:
      // TODO: Add document load component
      return null;
    default:
      const { iconUrl, resource } = getTraceResource(trace);
      if (!resource) return null;
      const entity = entityAliasesMap.get(resource);
      return {
        id: resource,
        name: resource,
        data: { iconUrl },
        type: ComponentType.GENERIC,
        linkedTo: entity?.entityId,
      };
  }
};

export default DebugSessionSystemMap;
