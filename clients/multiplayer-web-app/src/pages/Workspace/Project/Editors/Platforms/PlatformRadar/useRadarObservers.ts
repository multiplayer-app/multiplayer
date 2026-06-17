import * as Y from "yjs";
import { useEffect } from "react";

import { PlatformDetections } from "./types";
import type { PlatformDiagram } from "shared/components/Editors/PixiDiagram";
import type YDocManager from "shared/components/Editors/PixiDiagram/Editor/YDocManager";
import { newEdge } from "shared/helpers/diagram.helpers";
import { SystemViewTypes } from "shared/models/enums";

interface ObserverConfig {
  loading: boolean;
  editor: PlatformDiagram;
  docManager: YDocManager;
  componentEntities: Map<string, any>;
  entityAliasesMap: Map<string, any>;
  detections: PlatformDetections;
  onUpdateDetections: (newDetections: PlatformDetections) => void;
}

export function useRadarObservers({
  editor,
  loading,
  docManager,
  detections,
  componentEntities,
  entityAliasesMap,
  onUpdateDetections,
}: ObserverConfig) {
  useEffect(() => {
    if (!docManager || !componentEntities) {
      return;
    }

    const { components$, edges$, radar$ } = docManager;

    const existingEdgesMap = new Map<string, any>();
    const existingDetectionIds = new Set<string>();
    const entityToComponentMap = new Map<string, Map<string, any>>();
    const entityKeys = new Map<string, string>(
      Array.from(componentEntities.values()).map((e) => [e.key, e.entityId])
    );

    const buildReferenceMaps = () => {
      existingEdgesMap.clear();
      existingDetectionIds.clear();
      entityToComponentMap.clear();

      edges$.forEach((edge$) => {
        const edge = edge$.toJSON();
        existingDetectionIds.add(edge.detectionId);
        existingEdgesMap.set(`${edge.source}-${edge.target}`, edge);
      });

      components$.forEach((component) => {
        existingDetectionIds.add(component.detectionId);
        const linked =
          entityToComponentMap.get(component.linkedTo) || new Map();
        linked.set(component.id, component);
        entityToComponentMap.set(component.linkedTo, linked);
      });
    };

    const edgeExistsBetween = (
      sources: Map<string, any>,
      targets: Map<string, any>
    ): boolean => {
      for (const s of sources.keys()) {
        for (const t of targets.keys()) {
          const edge = existingEdgesMap.get(`${s}-${t}`);
          if (edge && !edge.detectionId) return true;
        }
      }
      return false;
    };

    const syncDetections = (shouldApply: boolean) => {
      try {
        const { components: comps, dependencies: deps } = detections;
        const { ignoredDetections, enabled } = radar$.toJSON();
        const ignored = new Set<string>(ignoredDetections);

        buildReferenceMaps();

        const unappliedComponents = comps.filter((d) => {
          if (!componentEntities.has(d.entityId) || ignored.has(d.id))
            return false;
          const linked = entityToComponentMap.get(d.entityId) || new Map();
          const unlinked = Array.from(linked.values()).filter(
            (c) => !c.detectionId
          );
          return unlinked.length === 0;
        });

        const unappliedDependencies = deps.reduce((acc, dep) => {
          if (ignored.has(dep.id)) return acc;

          const sourceId = entityKeys.get(dep.source);
          const targetId = entityKeys.get(dep.target);

          if (!sourceId || !targetId) return acc;

          const sourceNodes = entityToComponentMap.get(sourceId) || new Map();
          const targetNodes = entityToComponentMap.get(targetId) || new Map();

          if (edgeExistsBetween(sourceNodes, targetNodes)) return acc;

          acc.push({
            ...dep,
            sourceEntityId: sourceId,
            targetEntityId: targetId,
          });

          return acc;
        }, [] as typeof deps);

        const newDetections: PlatformDetections = {
          components: unappliedComponents,
          dependencies: unappliedDependencies,
        };

        onUpdateDetections(newDetections);

        if (!shouldApply || !enabled) return;

        docManager.transact(() => {
          unappliedComponents.forEach(({ id, entityId }) => {
            if (existingDetectionIds.has(id) || ignored.has(id)) {
              return;
            }
            docManager.addComponent({
              id: crypto.randomUUID(),
              linkedTo: entityId,
              detectionId: id,
            });
          });

          buildReferenceMaps();

          unappliedDependencies.forEach((dep) => {
            if (existingDetectionIds.has(dep.id) || ignored.has(dep.id)) {
              return;
            }
            const sourceComponents =
              entityToComponentMap.get(dep.sourceEntityId) || new Map();
            const targetComponents =
              entityToComponentMap.get(dep.targetEntityId) || new Map();

            if (!sourceComponents.size) {
              entityToComponentMap.set(dep.sourceEntityId, new Map());
              const sourceComponent = {
                id: crypto.randomUUID(),
                linkedTo: dep.sourceEntityId,
                detectionId: dep.id,
              };
              sourceComponents.set(sourceComponent.id, sourceComponent);
              docManager.addComponent(sourceComponent);
            }

            if (!targetComponents.size) {
              entityToComponentMap.set(dep.targetEntityId, new Map());
              const targetComponent = {
                id: crypto.randomUUID(),
                linkedTo: dep.targetEntityId,
                detectionId: dep.id,
              };
              targetComponents.set(targetComponent.id, targetComponent);
              docManager.addComponent(targetComponent);
            }

            for (const source of sourceComponents.keys()) {
              for (const target of targetComponents.keys()) {
                docManager.addEdge(
                  newEdge({ source, target, detectionId: dep.id })
                );
              }
            }
          });
        });
      } catch (e) {
        console.error(e);
      }
    };

    const cleanDetections = () => {
      const toRemoveComp = new Set<string>();
      const toRemoveEdges = new Set<string>();

      for (const [id, comp] of Object.entries(docManager.components)) {
        if (comp.detectionId) {
          toRemoveComp.add(id);
        }
      }
      for (const [id, edge] of Object.entries(docManager.edges)) {
        if (edge.detectionId) {
          toRemoveEdges.add(id);
        }
      }
      docManager.transact(() => {
        toRemoveComp.forEach((id) =>
          docManager.cleanupComponentData(id, false)
        );
        toRemoveEdges.forEach((id) => docManager.removeEdge(id, false));
      });
    };

    const initSync = async (isLocal: boolean) => {
      docManager.unobserve(edges$, onEdgesChange);
      docManager.unobserve(components$, onComponentsChange);

      if (!loading) {
        const shouldApply =
          isLocal && editor.currentViewId === SystemViewTypes.ALL;

        await syncDetections(shouldApply);
        docManager.observe(edges$, onEdgesChange);
        docManager.observe(components$, onComponentsChange);
      }
    };

    const onRadarChange = (event: Y.YMapEvent<any>, txn: Y.Transaction) => {
      const { keysChanged } = event;

      const radarEnabledChanged = txn.local && keysChanged.has("enabled");
      if (radarEnabledChanged && !radar$.get("enabled")) {
        cleanDetections();
      } else {
        initSync(txn.local);
      }
    };

    const onEdgesChange = (_: Y.YMapEvent<any>, txn: Y.Transaction) => {
      initSync(txn.local);
    };

    const onComponentsChange = (_: Y.YMapEvent<any>, txn: Y.Transaction) => {
      initSync(txn.local);
    };

    docManager.observe(radar$, onRadarChange);

    initSync(true);

    return () => {
      docManager.unobserve(radar$, onRadarChange);
      docManager.unobserve(edges$, onEdgesChange);
      docManager.unobserve(components$, onComponentsChange);
    };
  }, [
    loading,
    docManager,
    detections,
    componentEntities,
    entityAliasesMap,
    editor.currentViewId,
  ]);
}
