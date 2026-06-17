import {
  PlatformLayoutAlign,
  PlatformLayoutDirection,
} from "@multiplayer/types";
import { GraphNode } from "./components/GraphNode";
import { GraphEdge } from "./components/GraphEdge";

export interface IGraphLayout {
  setNodes(nodes: GraphNode[]): void;
  setEdges(edges: GraphEdge[]): void;
  layout(): void;
  getBounds(): { x: number; y: number; width: number; height: number };
  nodes: Map<string, GraphNode>;
  edges: Map<string, { source: string; target: string }>;
}

export interface IGraphLayoutOptions {
  rowGap: number;
  colGap: number;
  offsetX?: number;
  offsetY?: number;
  gridSize?: number;
  snapGrig?: boolean;
  minTrashHold?: number;
  align?: PlatformLayoutAlign;
  direction?: PlatformLayoutDirection;
  oldDirection?: PlatformLayoutDirection;
}
