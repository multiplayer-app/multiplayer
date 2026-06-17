import { PlatformNode } from "../../../types";
import {
  COMPONENT_WIDTH as defaultW,
  COMPONENT_HEIGHT as defaultH,
} from "../../../configs";

export class GraphNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parent: string;
  rank?: number;

  constructor(node: PlatformNode) {
    const bounds = node.getRealBounds();
    this.id = node.id;
    this.parent = node.groupId;
    this.x = getValidNumber(node.x, 0);
    this.y = getValidNumber(node.y, 0);

    this.width = getValidNumber(bounds?.width, defaultW);
    this.height = getValidNumber(bounds?.height, defaultH);
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
