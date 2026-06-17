import { PlatformTemplates } from "@multiplayer/entity";
import {
  Platform,
  Component,
  EntityType,
  EntityCommitChangeType,
} from "@multiplayer/types";
import { EntityCategories, PlatformChangeObject } from "shared/models/enums";
import { EntityWithMeta } from "shared/models/interfaces";
import { BranchChanges } from "shared/models/types";
import { setNestedProperty } from "shared/utils";
import { getChangeType } from "../changes.helpers";

interface EntityData {
  data: Platform;
  patch: any;
  changes: BranchChanges;
}

interface IPlatformChangesPayload {
  conflicts: Set<string>;
  source: EntityData | undefined;
  target: EntityData | undefined;
}

export const getPlatformChanges = (
  payload: IPlatformChangesPayload,
  entities: Record<EntityCategories, EntityWithMeta[]>
) => {
  const entityMap = new Map<string, EntityWithMeta>(
    entities[EntityCategories.COMPONENT].map((e) => [e.entityId, e])
  );

  const { source, target } = payload;

  let sourceList = [];
  let targetList = [];

  if (source) {
    sourceList = getCorrespondingChangesFromPatch(
      source.patch,
      source.data,
      entityMap,
      new Map([...source.changes, ...(target?.changes || [])])
    );
  }

  if (target) {
    targetList = getCorrespondingChangesFromPatch(
      target.patch,
      target.data,
      entityMap,
      new Map([...(source?.changes || []), ...target.changes])
    );
  }

  const groups = new Map();
  const paths = new Map();

  // Group changes by node id and path
  const groupByNodeId = (arr) => {
    return arr.reduce((acc, item) => {
      groups.set(item.groupId, item.groupSortKey);
      if (item.hiddenChange) return acc;
      const groupPath =
        paths.get(item.groupId) ||
        paths.set(item.groupId, new Map()).get(item.groupId);
      groupPath.set(item.path, item.sortKey);
      if (!acc[item.groupId]) acc[item.groupId] = {};
      acc[item.groupId][item.path] = item;
      return acc;
    }, {});
  };

  const groupedSourceChanges = groupByNodeId(sourceList);
  const groupedTargetChanges = groupByNodeId(targetList);
  const groupsArr = Array.from(groups.keys());

  groupsArr.sort((a, b) => {
    const fa = groups.get(a).toLowerCase();
    const fb = groups.get(b).toLowerCase();
    return fa < fb ? -1 : fa > fb ? 1 : 0;
  });

  return {
    groups: groupsArr.map((groupId) => {
      const groupPaths = paths.get(groupId);
      const pathsArray = Array.from(groupPaths.keys());

      pathsArray.sort((a, b) => {
        const fa = groupPaths.get(a);
        const fb = groupPaths.get(b);
        return fa < fb ? -1 : fa > fb ? 1 : 0;
      });

      return { groupId, paths: pathsArray };
    }),
    source: groupedSourceChanges,
    target: groupedTargetChanges,
  };
};

const getCorrespondingChangesFromPatch = (
  patch: any,
  data: Platform,
  entities: Map<string, EntityWithMeta>,
  branchChanges: BranchChanges
) => {
  if (!patch) return [];
  const { components = {}, edges, views, metadata } = patch;
  const changes = [];

  const nodesMap = getAllNodes(data.components, components);
  const entitiesMap = getAllPlatformComponentEntities(entities, branchChanges);

  if (metadata) {
    changes.push({
      path: "metadata",
      changeType: EntityCommitChangeType.UPDATE,
      key: metadata,
      sortKey: 0,
      patch: metadata,
      groupId: "metadata",
      groupSortKey: "metadata",
      message: "Metadata was changed",
      objectType: PlatformChangeObject.COMPONENT,
    });
  }

  if (components) {
    Object.keys(components).forEach((nodeId) => {
      const change = components[nodeId];
      const path = `components.${nodeId}`;
      const node = nodesMap.get(nodeId);
      const changeType = getChangeType(change);
      const entity = entitiesMap.get(node?.linkedTo);

      if (entity) {
        changes.push({
          path,
          changeType,
          key: nodeId,
          sortKey: 0,
          patch: change,
          groupId: nodeId,
          groupSortKey: entity.key,
          objectType: PlatformChangeObject.COMPONENT,
          message: getComponentMessage(changeType, entity.key),
        });
      }
    });
  }

  if (edges) {
    Object.keys(edges).forEach((key) => {
      const change = edges[key];
      const path = `edges.${key}`;
      const changeType = getChangeType(change);
      const [sourceId, targetId] = key.split("_");

      const sourceComponent = nodesMap.get(sourceId);
      const targetComponent = nodesMap.get(targetId);

      const sourceEntity = entitiesMap.get(sourceComponent?.linkedTo);
      const targetEntity = entitiesMap.get(targetComponent?.linkedTo);

      const isSideEffect =
        changeType === EntityCommitChangeType.DELETE &&
        (!data.components[sourceId] || !data.components[targetId]);

      // If Source or target nodes was deleted, edge deletion considered as side effect.
      if (sourceEntity && targetEntity) {
        changes.push({
          key,
          path,
          changeType,
          sortKey: 2,
          isSideEffect,
          patch: change,
          groupId: sourceId,
          groupSortKey: sourceEntity.key,
          message: getEdgeMessage(
            changeType,
            sourceEntity.key,
            targetEntity.key
          ),
          parentPaths: [`components.${sourceId}`, `components.${targetId}`],
          objectType: PlatformChangeObject.EDGE,
        });

        changes.push({
          key,
          path,
          changeType,
          sortKey: 2,
          isSideEffect,
          patch: change,
          groupId: targetId,
          groupSortKey: targetEntity.key,
          message: getEdgeMessage(
            changeType,
            targetEntity.key,
            sourceEntity.key
          ),
          parentPaths: [`components.${targetId}`, `components.${sourceId}`],
          objectType: PlatformChangeObject.EDGE,
        });

        // If there are no changes to the component itself, we need to add an empty change as the parent.
        if (!components[sourceId]) {
          changes.push({
            key: sourceId,
            sortKey: 0,
            groupId: sourceId,
            path: `components.${sourceId}`,
            groupSortKey: sourceEntity.key,
            changeType: EntityCommitChangeType.UPDATE,
            message: getComponentMessage(
              EntityCommitChangeType.UPDATE,
              sourceEntity.key
            ),
            objectType: PlatformChangeObject.COMPONENT,
          });
        }

        if (!components[targetId]) {
          changes.push({
            key: targetId,
            sortKey: 0,
            groupId: targetId,
            path: `components.${targetId}`,
            changeType: EntityCommitChangeType.UPDATE,
            groupSortKey: targetEntity.key,
            message: getComponentMessage(
              EntityCommitChangeType.UPDATE,
              targetEntity.key
            ),
            objectType: PlatformChangeObject.COMPONENT,
          });
        }
      }
    });
  }

  if (views) {
    const { _all, ...otherViews } = views;
    if (otherViews) {
      Object.keys(otherViews).forEach((viewId) => {
        const patch = otherViews[viewId];
        const path = `views.${viewId}`;
        const changeType = getChangeType(patch);
        const view = patch[0] || data.views[viewId];

        changes.push({
          key: viewId,
          path,
          patch,
          changeType,
          sortKey: 0,
          groupId: viewId,
          groupSortKey: `ZZZZZZZZ-${view.name}`,
          objectType: PlatformChangeObject.VIEW,
          message: getViewMessage(changeType, view.name),
        });
      });
    }
  }

  return changes;
};

export const getModifiedPlatformData = (data: Platform) => {
  if (!data) return PlatformTemplates.empty();
  const {
    components,
    edges,
    views: { _all, ...restViews },
    ...rest
  } = data;
  const positions = _all.visualizations.diagram;

  // Move position inside components
  return {
    edges: Object.keys(edges).reduce((acc, key) => {
      if (!edges[key].isDeleted) {
        acc[key] = edges[key];
      }
      return acc;
    }, {}),
    components: Object.keys(components).reduce((acc, key) => {
      if (!components[key].isDeleted) {
        acc[key] = {
          ...components[key],
          position: positions[key] || { x: 0, y: Infinity },
        };
      }
      return acc;
    }, {}),
    views: { ...restViews },
    // views: Object.keys(restViews).reduce((viewsAcc, viewId) => {
    //   const { visualizations, ...restView } = restViews[viewId];
    //   const positions = visualizations.diagram;
    //   viewsAcc[viewId] = {
    //     ...restView,
    //     components: Object.keys(positions).reduce((acc, nodeId) => {
    //       if (!components[nodeId]) return acc;
    //       acc[nodeId] = {
    //         ...components[nodeId],
    //         position: positions[nodeId] || { x: 0, y: Infinity },
    //       };
    //       return acc;
    //     }, {}),
    //   };
    //   return viewsAcc;
    // }, {}),
    ...rest,
  };
};

export const getExtractedPatch = (patch) => {
  const { components = {}, views, ...rest } = patch;
  const newPatch = {
    ...(views ? { views: { ...views } } : {}),
    ...rest,
  };

  Object.keys(components).forEach((key) => {
    const positionPath = `views._all.visualizations.diagram.${key}`;
    const patch = components[key];
    if (Array.isArray(patch)) {
      const [{ position, ...otherInfo }, ...rest] = patch;
      setNestedProperty(newPatch, positionPath, [position, ...rest]);
      setNestedProperty(newPatch, `components.${key}`, [otherInfo, ...rest]);
    } else {
      const { position, ...otherInfo } = patch;
      setNestedProperty(newPatch, positionPath, position);
      if (Object.keys(otherInfo).length) {
        setNestedProperty(newPatch, `components.${key}`, otherInfo);
      }
    }
  });
  return newPatch;
};

// Get existing and removed entities
const getAllPlatformComponentEntities = (
  entities: Map<string, EntityWithMeta>,
  changes: BranchChanges
) => {
  const entitiesMap = new Map(entities);

  for (const { entity, entityCommit } of changes.values()) {
    if (
      entity.type === EntityType.PLATFORM_COMPONENT &&
      entityCommit.changeType === EntityCommitChangeType.DELETE
    ) {
      entitiesMap.set(entity.entityId, entity);
    }
  }

  return entitiesMap;
};

// Get existing and removed nodes
const getAllNodes = (
  existingComponents: Record<string, Component>,
  changedComponents: Record<string, any>
): Map<string, Component> => {
  const patchComponents = Object.values(changedComponents)
    .filter((item) => Array.isArray(item))
    .reduce((acc, [node]) => {
      acc[node.id] = node;
      return acc;
    }, {});

  const allNodes = new Map<string, Component>([
    ...Object.entries(existingComponents),
    ...Object.entries(patchComponents),
  ] as [string, Component][]);

  return allNodes;
};

const getComponentMessage = (type: EntityCommitChangeType, entity: string) => {
  switch (type) {
    case EntityCommitChangeType.CREATE:
      return `<b>${entity}</b> was added`;
    case EntityCommitChangeType.DELETE:
      return `<b>${entity}</b> was removed`;
    default:
      return `<b>${entity}</b> was changed`;
  }
};

const getViewMessage = (type: EntityCommitChangeType, view: string) => {
  switch (type) {
    case EntityCommitChangeType.CREATE:
      return `<b>${view}</b> view was added`;
    case EntityCommitChangeType.DELETE:
      return `<b>${view}</b> view was removed`;
    default:
      return `<b>${view}</b> view was changed`;
  }
};

const getEdgeMessage = (
  type: EntityCommitChangeType,
  source: string,
  target: string
) => {
  switch (type) {
    case EntityCommitChangeType.CREATE:
      return ` Dependency between <b>${source}</b> and <b>${target}</b> was added`;
    case EntityCommitChangeType.DELETE:
      return ` Dependency between <b>${source}</b> and <b>${target}</b> was removed`;
    default:
      return ` Dependency between <b>${source}</b> and <b>${target}</b> was changed`;
  }
};

export const getPlatformConflicts = (changes): Set<string> => {
  const conflicts = new Set<string>();
  changes.groups.forEach(({ groupId, paths }) => {
    paths.forEach((path) => {
      const s = changes.source[groupId] && changes.source[groupId][path];
      const t = changes.target[groupId] && changes.target[groupId][path];
      if (
        s &&
        t &&
        JSON.stringify(s.patch) !== JSON.stringify(t.patch) &&
        !isPositionChange(s, t)
      ) {
        conflicts.add(path);
      }
    });
  });
  return conflicts;
};

export const isPositionChange = (s, t) => {
  if (
    !s.patch ||
    !t.patch ||
    s.changeType !== EntityCommitChangeType.UPDATE ||
    t.changeType !== EntityCommitChangeType.UPDATE
  )
    return false;
  let { position: position1, ...rest1 } = s.patch;
  let { position: position2, ...rest2 } = t.patch;
  // TODO: Handel metadata change case
  if (
    position1 &&
    position2 &&
    JSON.stringify(rest1) === JSON.stringify(rest2)
  ) {
    position2 = position1;
    return true;
  }
};
