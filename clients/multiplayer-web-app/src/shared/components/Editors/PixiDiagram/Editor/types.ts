import * as Y from "yjs";
import { Point } from "pixi.js";
import {
  Platform,
  ComponentType,
  ComponentMetadata,
  EntityCommitChangeType,
  VisualizationType,
  EdgePosition,
} from "@multiplayer/types";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";
import { UseUndoManagerReturn } from "shared/hooks/useYUndoManager";

import type GroupNode from "./components/GroupNode";
import type ComponentNode from "./components/ComponentNode";

export enum DiagramEvents {
  mount = "mount",
  update = "update",
  destroy = "destroy",
  add_node = "add-node",
  remove_node = "remove-node",
  add_edge = "add-edge",
  new_edge_source = "new-edge-source",
  new_edge_target = "new-edge-target",
  create_edge = "create-edge",
  edge_creation_end = "edge-creation-end",
  remove_edge = "remove-edge",
  open_node = "open-node",
  select_node = "select-node",
  select_edge = "select-edge",
  selected = "selected",
  selection_end = "selection-end",
  selection_done = "selection-done",
  selection_update = "selection-update",
  drag_start = "drag_start",
  dragging = "dragging",
  drag_end = "drag_end",
  moved = "moved",
  moved_end = "moved-end",
  zoomed = "zoomed",
  zoomed_end = "zoomed-end",
  delete = "delete",
  check_entities = "check-entities",
  visibility_change = "visibility_change",
  focus = "focus",
  tool_change = "tool-change",
  theme_change = "theme-change",
}

export type SelectionEvents =
  | DiagramEvents.selection_end
  | DiagramEvents.selection_update;

export type NewEdgeEvents = DiagramEvents.edge_creation_end;

export enum ToolType {
  SELECT = "select",
  HAND = "hand",
}
export interface EdgeOptions {
  id: string;
  source: ComponentNode;
  target?: ComponentNode;
  targetPoint?: Point;
  sourcePosition?: EdgePosition;
  targetPosition?: EdgePosition;
  offset?: number;
  borderRadius?: number;
  isDeleted?: boolean;
  changeType?: EntityCommitChangeType;
}

export type ChangeObject = { type: EntityCommitChangeType; data?: any };
export type ChangesMap = Map<string, ChangeObject>;

export interface IDataDiff {
  groups: ChangesMap;
  nodes: ChangesMap;
  edges: ChangesMap;
}

export interface EditorOptions {
  doc?: Y.Doc;
  provider?: YjsSocketIOProvider;
  readonly?: boolean;
  initialData?: Platform;
  currentViewId?: string;
  undoManager?: UseUndoManagerReturn;
  visualizationType?: VisualizationType;
}
export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  isDefault?: boolean;
}

export type XYPosition = {
  x: number;
  y: number;
};
export interface EdgeSegment {
  code: "M" | "L" | "Q" | "C";
  x: number;
  y: number;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
}

export type BaseNodeType = ComponentType | "group" | "platform";
export interface BaseNodeMetadata extends ComponentMetadata { }

export type PlatformNode = GroupNode | ComponentNode;
