import { v4 as uuidv4 } from "uuid";
import {
  Edge,
  UNKNOWN_X,
  UNKNOWN_Y,
  Component,
  NodeState,
  EdgeDirection,
  ComponentType,
  VisualizationState,
  EntityCommitChangeType,
  PlatformLayoutDirection,
} from "@multiplayer/types";
import { getNestedProperty } from "shared/utils";
import { SystemViewTypes } from "shared/models/enums";
import {
  EntityWithMeta,
  IPlatformGroupData,
  IComponentNodeData,
} from "shared/models/interfaces";
import { isValidPosition } from "shared/helpers/diagram.helpers";

import { ChangesMap } from "../types";
import type YDocManager from "../YDocManager";
import type GroupNode from "../components/GroupNode";
import {
  GRID_SIZE,
  ROW_HEIGHT,
  COLUMN_WIDTH,
  LAYOUT_SPACINGS,
  COMPONENT_HEIGHT,
  COMPONENT_WIDTH,
} from "../configs";

import { generateObjectId } from "./objectId";

export function getPlatformGroups(
  yDocManager: YDocManager,
  changes: ChangesMap
): IPlatformGroupData[] {
  const groups = {};
  const isDiff = yDocManager.currentViewId === SystemViewTypes.DIFFS;
  const isChanges = yDocManager.currentViewId === SystemViewTypes.CHANGES;

  changes.forEach((change) => {
    const { type: changeType, data } = change;
    if (changeType === EntityCommitChangeType.DELETE && data && data.group) {
      const state = isValidPosition(data.state)
        ? data.state
        : { x: 0, y: 0, collapsed: false };

      groups[data.group.id] = {
        ...data.group,
        state,
        changeType,
        type: "group",
      };
    }
  });

  const data = yDocManager.getGroupsInView();

  Object.values(data).forEach((group) => {
    const changeType = changes.get(group.id)?.type;
    if (isChanges && !changeType) return;
    const state = yDocManager.states$.get(group.id);

    if (state) {
      groups[group.id] = {
        ...group,
        changeType,
        type: "group",
        state: state.toJSON(),
        isPassive: isDiff ? !changeType : false,
      };
    } else if (yDocManager.isSystemView) {
      console.log("MISSING GROUP DATA: ", JSON.stringify(group));
    }
  });

  return Object.values(groups);
}

export function getPlatformComponents(
  yDocManager: YDocManager,
  changes: ChangesMap,
  platformComponents: Map<string, EntityWithMeta>
): {
  components: IComponentNodeData[];
  missingEntities: string[];
  missingStates: string[];
} {
  const components = {};
  const missingEntities: Set<string> = new Set();
  const missingStates: Set<string> = new Set();
  if (!platformComponents) {
    return {
      components: [],
      missingEntities: [],
      missingStates: [],
    };
  }

  const states = yDocManager.states;
  const data = yDocManager.getComponentsInView();
  const isDiff = yDocManager.currentViewId === SystemViewTypes.DIFFS;
  const isChanges = yDocManager.currentViewId === SystemViewTypes.CHANGES;

  // Add deleted nodes to the list
  changes.forEach((change) => {
    const { type: changeType, data } = change;
    if (changeType === EntityCommitChangeType.DELETE && data?.component) {
      const component = data.component;
      const entity = platformComponents.get(component.linkedTo);
      if (entity) {
        let state;
        if (isValidPosition(data.state)) {
          state = { ...data.state };
        } else {
          state = getNewState(states, Object.values(components).length - 1);
        }

        components[component.id] = getNodeData({
          component,
          entity,
          state,
          changeType,
        });
      }
    }
  });



  let rowIndex = 0;

  const getState = (component: Component) => {
    let state = states[component.id];
    if (!isValidPosition(state)) {
      state = getNewState(states, rowIndex++);
      missingStates.add(component.id);
    }
    return state;
  }

  Object.values(data).forEach((component) => {
    if (component.linkedTo) {
      const entity = platformComponents.get(component.linkedTo);
      if (!entity) {
        missingEntities.add(component.linkedTo);
        return;
      }

      const changeType = changes.get(component.id)?.type;
      if (isChanges && !changeType) {
        return;
      }

      const state = getState(component);

      components[component.id] = getNodeData({
        entity,
        state,
        component,
        changeType,
        isPassive: isDiff ? !changeType : false,
      });
    } else {
      // TODO: handle this case
      const state = getState(component);
      components[component.id] = {
        ...component, state,
      };
    }
  });

  return {
    components: Object.values(components),
    missingStates: Array.from(missingStates),
    missingEntities: Array.from(missingEntities),
  };
}

export function getPlatformEdges(
  yDocManager,
  changes: ChangesMap,
  includeAddedNodes: boolean = false
): any[] {
  const edges = [];
  (Object.values(yDocManager.edges$.toJSON()) as Edge[]).forEach((edge) => {
    const changeType = changes.get(edge.id)?.type;
    edges.push({ ...edge, changeType });
  });

  changes.forEach(({ type, data }) => {
    if (
      type === EntityCommitChangeType.DELETE ||
      (includeAddedNodes && type === EntityCommitChangeType.CREATE)
    ) {
      edges.push({
        ...data[0],
        isDeleted: true,
        changeType: type,
      });
    }
  });

  return edges;
}

export function createPlatformNodes(
  entityIds: string[],
  platformComponents: Map<string, EntityWithMeta>,
  parentGroup: GroupNode,
  state: NodeState,
  direction: EdgeDirection,
  layoutDirection: PlatformLayoutDirection
) {
  return entityIds.reduce((acc, entityId, i) => {
    const entity = platformComponents.get(entityId);
    if (entity) {
      const component = getNewNodeData(
        entity,
        getStackedState(state, direction, i, layoutDirection),
        parentGroup?.id
      );
      acc.push(component);
    }
    return acc;
  }, []);
}

export function getClipboardData(
  e: ClipboardEvent,
  platformComponents: Map<string, EntityWithMeta>,
  docManager: YDocManager
) {
  let edges = new Map();
  let groups = new Map();
  let components = new Map();

  try {
    // @ts-ignore
    const pasteData = e.clipboardData || window.clipboardData;
    const pastedText = pasteData.getData("text");
    const clipboardJson = JSON.parse(pastedText);
    const cbNodes = Array.isArray(clipboardJson.nodes)
      ? clipboardJson.nodes
      : [];
    const cbGroups = Array.isArray(clipboardJson.groups)
      ? clipboardJson.groups
      : [];

    cbGroups.forEach((group) => {
      if (docManager.states$.has(group.id)) {
        group.state.x = group.state.x + GRID_SIZE;
        group.state.y = group.state.y + GRID_SIZE;
      }
      groups.set(group.id, { ...group, id: generateObjectId() });
    });

    cbNodes.forEach((node) => {
      if (node && node.id && node.linkedTo && node.state) {
        const { id, groupId, linkedTo, state } = node;
        const entity = platformComponents.get(linkedTo);
        if (entity) {
          const pos = !docManager.states$.has(id)
            ? state
            : { x: state.x + GRID_SIZE, y: state.y + GRID_SIZE };
          const newNode = getNewNodeData(entity, pos);
          const group = groups.get(groupId);
          if (group) {
            newNode["groupId"] = group.id;
          }
          components.set(id, newNode);
        }
      }
    });

    if (components.size) {
      const cbEdges = Array.isArray(clipboardJson.edges)
        ? clipboardJson.edges
        : [];
      cbEdges.forEach((edge) => {
        if (
          edge &&
          (components.has(edge.source) ||
            docManager.components$.has(edge.source)) &&
          (components.has(edge.target) ||
            docManager.components$.has(edge.target))
        ) {
          const sourceNode = components.get(edge.source);
          const targetNode = components.get(edge.target);
          const source = sourceNode ? sourceNode.id : edge.source;
          const target = targetNode ? targetNode.id : edge.target;
          const newEdge = {
            source,
            target,
            id: `${source}_${target}`,
          };
          edges.set(newEdge.id, newEdge);
        }
      });
    }
  } catch (error) {
    throw new Error("Error parsing clipboard data");
  }
  return { components, edges, groups };
}

function getStackedState(pos, dir, i, layoutDirection): NodeState {
  const { COLUMN_GAP, ROW_GAP } = LAYOUT_SPACINGS[layoutDirection];
  const rowHeight = COMPONENT_HEIGHT + ROW_GAP;
  const colWidth = COMPONENT_WIDTH + COLUMN_GAP;

  if (layoutDirection === PlatformLayoutDirection.HORIZONTAL) {
    switch (dir) {
      case EdgeDirection.top:
        return { ...pos, x: pos.x, y: pos.y - rowHeight * i };
      case EdgeDirection.left:
        return { ...pos, x: pos.x, y: pos.y + rowHeight * i };
      case EdgeDirection.right:
      case EdgeDirection.bottom:
        return { ...pos, x: pos.x, y: pos.y + rowHeight * i };
      default:
        return pos;
    }
  } else {
    switch (dir) {
      case EdgeDirection.left:
        return { ...pos, x: pos.x - colWidth * i, y: pos.y };
      case EdgeDirection.top:
        return { ...pos, x: pos.x + colWidth * i, y: pos.y };
      case EdgeDirection.right:
      case EdgeDirection.bottom:
        return { ...pos, x: pos.x + colWidth * i, y: pos.y };
      default:
        return pos;
    }
  }
}

export function getNewNodeData(
  entity: EntityWithMeta,
  state: NodeState,
  groupId?: string
) {
  return getNodeData({
    entity,
    state,
    component: { id: uuidv4(), linkedTo: entity.entityId, groupId },
  });
}

export function getNodeData(options: {
  component: Component;
  entity: EntityWithMeta;
  state?: NodeState;
  changeType?: EntityCommitChangeType;
  isPassive?: boolean;
  isReadonly?: boolean;
}) {
  const { component, entity, state, changeType, isPassive, isReadonly } =
    options;

  const baseType = component.type || ComponentType.GENERIC;
  const name = getNestedProperty(entity, ["key"], component.name);
  const data = getNestedProperty(entity, ["metadata"], component.data);
  const type = getNestedProperty<ComponentType>(data, ["type"], baseType);

  return {
    ...component,
    state,
    data: data || { type },
    type,
    name,
    changeType,
    isPassive,
    isReadonly,
    isDeleted: changeType === EntityCommitChangeType.DELETE,
  };
}

export function getOffsetPoint(nodes: any[]): { x: number; y: number } {
  let x = getMinimumMyAxis(
    nodes.filter(({ state }) => state && state.x !== UNKNOWN_X),
    "x"
  );
  let y = getMinimumMyAxis(
    nodes.filter(({ state }) => state && state.y !== UNKNOWN_Y),
    "y"
  );
  return { x, y };
}

function getNewState(states: VisualizationState, rowIndex) {
  const maxX = Math.max(...Object.values(states).map((pos) => +pos.x), 0);
  return { x: maxX + COLUMN_WIDTH, y: rowIndex * ROW_HEIGHT };
}

function getMinimumMyAxis(nodes: any[], axis: "x" | "y"): number {
  if (!nodes.length) return 0;
  return Math.min(...nodes.map((node) => node.state[axis])) || 0;
}
