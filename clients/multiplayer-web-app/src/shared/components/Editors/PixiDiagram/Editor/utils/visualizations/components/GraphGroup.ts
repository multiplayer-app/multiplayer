import {
  COMPONENT_WIDTH as defaultW,
  COMPONENT_HEIGHT as defaultH,
  COMPONENT_GAP as padding,
  GROUP_INFO_HEIGHT as contentHeight,
  GROUP_ROW_GAP as rowGap,
  GROUP_COLUMN_GAP as colGap,
} from "../../../configs";
import { Group, NodeState } from "@multiplayer/types";
import type { GraphNode } from ".";

export class GraphGroup {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  groupId: string;
  rank?: number;
  childNodes: Map<string, GraphNode>;

  rowGap = rowGap;
  colGap = colGap;
  padding = [padding * 2 + contentHeight, padding, padding, padding];

  constructor(group: Group, state: NodeState) {
    this.id = group.id;
    this.groupId = group.groupId;
    this.x = getValidNumber(state.x, 0);
    this.y = getValidNumber(state.y, 0);
    this.collapsed = state.collapsed; // If width or height is missing consider as collapsed

    this.width = getValidNumber(state.width, defaultW);
    this.height = getValidNumber(state.height, defaultH);
    this.childNodes = new Map();
  }

  toJSON(): NodeState {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      collapsed: this.collapsed,
    };
  }

  addChildNode(node: GraphNode): void {
    this.childNodes.set(node.id, node);
  }
}

function getValidNumber(value: any, defaultValue: number): number {
  return Math.round(isValidNumber(value) ? Number(value) : defaultValue);
}

function isValidNumber(value: any): value is number {
  return (
    (typeof value === "number" ||
      (typeof value === "string" && !isNaN(Number(value)))) &&
    isFinite(Number(value))
  );
}
