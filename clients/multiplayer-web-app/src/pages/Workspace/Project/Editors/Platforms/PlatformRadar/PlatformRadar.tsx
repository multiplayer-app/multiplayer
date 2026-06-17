import { Icon, useDisclosure } from "@chakra-ui/react";
import {
  Component,
  IntegrationTypeEnum,
  PlatformRadarData,
} from "@multiplayer/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import useYMapState from "shared/hooks/useYMapState";
import { RadarIcon } from "shared/icons";
import { EntityCategories } from "shared/models/enums";
import { EntityWithMeta } from "shared/models/interfaces";
import { ToolbarButton } from "shared/components/Toolbar";
import { useEntities } from "shared/providers/EntitiesContext";
import { useFullScreenContext } from "shared/providers/FullScreenContext";
import YDocManager from "shared/components/Editors/PixiDiagram/Editor/YDocManager";
import { useMultiplayerStateContext } from "shared/providers/MultiplayerStateContext";

import {
  ComponentDetection,
  DependencyDetection,
  PlatformDetections,
} from "./types";
import PlatformRadarDrawer from "./PlatformRadarDrawer";
import usePlatformRadarDetections from "./usePlatformRadarDetections";

import { useRadarObservers } from "./useRadarObservers";
import { newEdge } from "shared/helpers/diagram.helpers";
import type { PlatformDiagram } from "shared/components/Editors/PixiDiagram";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface PlatformRadarProps {
  parentContainer?: HTMLDivElement;
  editor: PlatformDiagram;
}

const defaultState = () => ({
  components: [],
  dependencies: [],
});

const PlatformRadar = ({ editor }: PlatformRadarProps) => {
  const disclosure = useDisclosure();
  const fsContext = useFullScreenContext();
  const { doc } = useMultiplayerStateContext();
  const state$ = useRef(doc.getMap("object"));
  const { integrations: all } = useIntegrations();
  const { withSandboxCheck } = useProjectSandbox();
  const isRadarActive = useMemo(
    () => !!all.get(IntegrationTypeEnum.OTEL)?.length,
    [all]
  );
  const docManager = useMemo<YDocManager>(() => new YDocManager(doc), [doc]);
  const [radar, serRadar] = useYMapState<PlatformRadarData>(
    state$.current.get("radar")
  );
  const { entity, entities, entityAliasesMap, entitiesFetching } =
    useEntities();

  const isDefaultPlatform = !!entity?.default;
  const { detections, loading } = usePlatformRadarDetections(isDefaultPlatform);
  const [newDetections, setNewDetections] = useState<PlatformDetections>(
    defaultState()
  );

  const componentEntities = useMemo(() => {
    if (entitiesFetching) return null;
    return new Map<string, EntityWithMeta>(
      entities[EntityCategories.COMPONENT].map((e) => [e.entityId, e])
    );
  }, [entities, entitiesFetching]);

  useRadarObservers({
    editor,
    loading,
    docManager,
    detections,
    entityAliasesMap,
    componentEntities,
    onUpdateDetections: setNewDetections,
  });

  const getTemporaryDetections = () => {
    const componentsByDetectionId = Object.values(docManager.components).reduce(
      (map, comp) => {
        if (comp.detectionId) {
          map[comp.detectionId] = comp;
        }
        return map;
      },
      {} as Record<string, (typeof docManager.components)[string]>
    );

    const edgesByDetectionId = Object.values(docManager.edges).reduce(
      (map, edge) => {
        if (edge.detectionId) {
          map[edge.detectionId] = edge;
        }
        return map;
      },
      {} as Record<string, (typeof docManager.edges)[string]>
    );

    return { componentsByDetectionId, edgesByDetectionId };
  };

  const applyTemporaryComponent = (componentId: string) => {
    const tempComponent = docManager.components$.get(componentId);
    if (!tempComponent) return;
    const { detectionId, ...cleanComponent } = tempComponent;
    docManager.components$.set(cleanComponent.id, cleanComponent);
  };

  const applyTemporaryEdge = (edgeId: string) => {
    const edge$ = docManager.edges$.get(edgeId);
    if (!edge$) return;
    edge$?.delete("detectionId");
  };

  const applyTemporaryDetections = (
    c: ComponentDetection[],
    d: DependencyDetection[]
  ) => {
    const { componentsByDetectionId, edgesByDetectionId } =
      getTemporaryDetections();

    docManager.transact(() => {
      for (const detection of c) {
        const matchedComponent = componentsByDetectionId[detection.id];
        if (matchedComponent) {
          applyTemporaryComponent(matchedComponent.id);
        }
      }

      for (const detection of d) {
        const matchedEdge = edgesByDetectionId[detection.id];
        if (matchedEdge) {
          const { id, source, target } = matchedEdge;
          applyTemporaryEdge(id);
          applyTemporaryComponent(source);
          applyTemporaryComponent(target);
        }
      }
      docManager.removeDetectionsFromIgnores(c.map((c) => c.id));
      docManager.removeDetectionsFromIgnores(d.map((d) => d.id));
    });
  };

  const applyPermanentDetections = useCallback(
    (c: ComponentDetection[], d: DependencyDetection[]) => {
      const ignoredIds = new Set<string>(radar.ignoredDetections || []);
      const entityIdToComponentIdMap = new Map<string, string>();
      const newComponents: Record<string, Component> = {};
      const { componentsByDetectionId, edgesByDetectionId } =
        getTemporaryDetections();

      const existingComponentsByEntityId = new Map<string, string>();
      Object.values(docManager.components).forEach((comp) => {
        if (comp.linkedTo) {
          existingComponentsByEntityId.set(comp.linkedTo, comp.id);
        }
      });

      c.forEach((comp) => {
        if (ignoredIds.has(comp.id)) return;

        const existingComponent = componentsByDetectionId[comp.id];
        if (existingComponent) {
          const { detectionId, ...cleanComponent } = existingComponent;
          newComponents[cleanComponent.id] = cleanComponent;
          entityIdToComponentIdMap.set(comp.entityId, cleanComponent.id);
        } else if (existingComponentsByEntityId.has(comp.entityId)) {
          const existingId = existingComponentsByEntityId.get(comp.entityId)!;
          entityIdToComponentIdMap.set(comp.entityId, existingId);
        } else {
          const id = crypto.randomUUID();
          newComponents[id] = { id, linkedTo: comp.entityId };
          entityIdToComponentIdMap.set(comp.entityId, id);
          existingComponentsByEntityId.set(comp.entityId, id);
        }
      });

      const existingEdgeMap = new Set<string>();
      Object.values(docManager.edges).forEach((edge) => {
        existingEdgeMap.add(`${edge.source}-${edge.target}`);
      });

      const newEdges = d.flatMap((dep) => {
        if (ignoredIds.has(dep.id)) return [];

        const existingEdge = edgesByDetectionId[dep.id];
        if (existingEdge) {
          const { detectionId, ...cleanEdge } = existingEdge;
          return cleanEdge;
        }

        const sourceIds = [
          entityIdToComponentIdMap.get(dep.sourceEntityId),
          existingComponentsByEntityId.get(dep.sourceEntityId),
        ].filter(Boolean);

        const targetIds = [
          entityIdToComponentIdMap.get(dep.targetEntityId),
          existingComponentsByEntityId.get(dep.targetEntityId),
        ].filter(Boolean);

        if (sourceIds.length === 0) {
          const newSource = {
            id: crypto.randomUUID(),
            linkedTo: dep.sourceEntityId,
          };
          newComponents[newSource.id] = newSource;
          entityIdToComponentIdMap.set(dep.sourceEntityId, newSource.id);
          sourceIds.push(newSource.id);
        }

        if (targetIds.length === 0) {
          const newTarget = {
            id: crypto.randomUUID(),
            linkedTo: dep.targetEntityId,
          };
          newComponents[newTarget.id] = newTarget;
          entityIdToComponentIdMap.set(dep.targetEntityId, newTarget.id);
          targetIds.push(newTarget.id);
        }

        return sourceIds.flatMap((source) =>
          targetIds
            .filter((target) => !existingEdgeMap.has(`${source}-${target}`))
            .map((target) => {
              existingEdgeMap.add(`${source}-${target}`);
              return { source, target };
            })
        );
      });

      docManager.transact(() => {
        Object.values(newComponents).forEach((component) => {
          docManager.addComponent(component);
        });

        newEdges.forEach((edge) => {
          docManager.addEdge(newEdge(edge));
        });
      });
    },
    [radar.ignoredDetections, docManager, getTemporaryDetections]
  );

  const handleApplyDetections = (
    c: ComponentDetection[],
    d: DependencyDetection[]
  ) => {
    if (radar.enabled) {
      applyTemporaryDetections(c, d);
    } else {
      applyPermanentDetections(c, d);
    }
  };

  const handleApplyAllDetections = () => {
    applyPermanentDetections(
      newDetections.components,
      newDetections.dependencies
    );
  };

  const handleIgnoreDetections = (
    c: ComponentDetection[],
    d: DependencyDetection[]
  ) => {
    const allDetectionIds = [
      ...c.map((comp) => comp.id),
      ...d.map((dep) => dep.id),
    ];

    docManager.transact(() => {
      docManager.addDetectionsToIgnores(allDetectionIds);
      const { componentsByDetectionId, edgesByDetectionId } =
        getTemporaryDetections();
      c.forEach((comp) => {
        const matchedComponent = componentsByDetectionId[comp.id];
        if (matchedComponent) {
          docManager.cleanupComponentData(matchedComponent.id, false);
        }
      });
      d.forEach((dep) => {
        const matchedEdge = edgesByDetectionId[dep.id];
        if (matchedEdge) {
          docManager.removeEdge(matchedEdge.id, false);
        }
      });
    });
  };

  useEffect(() => {
    if (isDefaultPlatform && !loading && detections) {
      applyPermanentDetections(
        newDetections.components,
        newDetections.dependencies
      );
    }
  }, [
    isDefaultPlatform,
    loading,
    detections,
    applyPermanentDetections,
    newDetections.components,
    newDetections.dependencies,
  ]);

  if (isDefaultPlatform) return null;

  return (
    <>
      <ToolbarButton
        label="Auto-Docs"
        icon={
          <Icon
            as={RadarIcon}
            color={radar.enabled && isRadarActive ? "green.400" : "muted"}
          />
        }
        onClick={withSandboxCheck(disclosure.onToggle)}
      />
      {disclosure.isOpen && (
        <PlatformRadarDrawer
          radarData={radar}
          setRadarData={serRadar}
          disclosure={disclosure}
          detections={newDetections}
          isRadarActive={isRadarActive}
          onApply={handleApplyDetections}
          onIgnore={handleIgnoreDetections}
          onApplyAll={handleApplyAllDetections}
          parentContainer={fsContext?.contentContainerRef.current}
        />
      )}
    </>
  );
};

export default PlatformRadar;
