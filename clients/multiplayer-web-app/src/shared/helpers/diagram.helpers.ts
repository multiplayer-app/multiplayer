import {
  Component,
  Edge,
  Group,
  Position,
  UNKNOWN_X,
  UNKNOWN_Y,
  View,
} from "@multiplayer/types";

import { getLastNumberFromName, getSlugifiedName, isObject } from "../utils";

import { IEdge } from "../models/interfaces";
import { SystemViewTypes } from "../models/enums";

export function getNewViewName(views: Record<string, View>) {
  return getLastNumberFromName(Object.values(views));
}

export function getNewGroupName(groups: Record<string, Group>) {
  return getSlugifiedName(
    getLastNumberFromName(Object.values(groups), "group-")
  );
}

export function isDynamicView(viewId) {
  return viewId === SystemViewTypes.DIFFS || viewId === SystemViewTypes.CHANGES;
}

export function isSystemView(viewId) {
  return (
    viewId === SystemViewTypes.DIFFS ||
    viewId === SystemViewTypes.CHANGES ||
    viewId === SystemViewTypes.ALL
  );
}

export function newEdge(payload: Partial<Edge>) {
  const { source, target, ...rest } = payload;
  return { id: `${source}_${target}`, source, target, ...rest };
}

export function findEdge(
  edges: IEdge[],
  source: Component,
  target: Component
): IEdge {
  return edges.find(
    (e) =>
      (e.source === source.id && e.target === target.id) ||
      (e.target === source.id && e.source === target.id)
  );
}

export const isValidPosition = (pos: Position) => {
  if (!isObject(pos)) return false;
  return (
    typeof pos.x === "number" &&
    typeof pos.y === "number" &&
    !isNaN(pos.x) &&
    !isNaN(pos.y) &&
    pos.x !== UNKNOWN_X &&
    pos.y !== UNKNOWN_Y
  );
};

export const getTopLeftNodePosition = (ids, positions, center) => {
  if (!ids.length) return center;
  const newPosition = { x: Infinity, y: Infinity };

  ids.forEach((id) => {
    const pos = positions[id];
    if (pos && pos.x <= newPosition.x && pos.y < newPosition.y) {
      newPosition.x = pos.x;
      newPosition.y = pos.y;
    }
  });

  return newPosition;
};
