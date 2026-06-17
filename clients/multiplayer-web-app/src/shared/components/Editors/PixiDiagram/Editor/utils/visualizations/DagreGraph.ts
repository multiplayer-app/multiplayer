import dagre from "@dagrejs/dagre";
import { IGraphLayout, IGraphLayoutOptions } from "./IGraphLayout";
import {
  PlatformLayoutAlign,
  PlatformLayoutDirection,
} from "@multiplayer/types";
import { GraphNode } from "./components";
export class DagreGraph implements IGraphLayout {
  graph: dagre.graphlib.Graph;

  public get nodes(): Map<string, GraphNode> {
    return new Map(
      this.graph.nodes().map((id) => [id, this.graph.node(id) as GraphNode])
    );
  }

  public get edges(): Map<string, { source: string; target: string }> {
    return new Map(
      this.graph
        .edges()
        .map((edge) => [edge.name, { source: edge.v, target: edge.w }])
    );
  }

  constructor(private options: IGraphLayoutOptions) {
    this.graph = new dagre.graphlib.Graph({});

    this.graph.setGraph({
      marginx: this.options.offsetX || 0,
      marginy: this.options.offsetY || 0,
      rankdir: this.options.direction || PlatformLayoutDirection.HORIZONTAL,
      nodesep: this.options.rowGap,
      ranksep: this.options.colGap,
      acyclicer: "greedy",
    });

    this.graph.setDefaultEdgeLabel(() => ({}));
  }

  public setNodes(nodes: GraphNode[]) {
    const key =
      this.options.direction === PlatformLayoutDirection.HORIZONTAL ? "y" : "x";
    nodes.sort((a, b) => a[key] - b[key]);

    nodes.forEach((node, index) => {
      this.graph.setNode(node.id, {
        width: node.width,
        height: node.height,
        rank: index,
      });
    });
  }

  public setEdges(edges: { source: string; target: string }[]) {
    const uniqueEdges = new Set();
    edges.forEach((edge) => {
      const key = `${edge.source}_${edge.target}`;
      if (!uniqueEdges.has(key)) {
        uniqueEdges.add(key);
        this.graph.setEdge(edge.source, edge.target);
      }
    });
  }

  public layout() {
    dagre.layout(this.graph);
    this.graph.nodes().forEach((id) => {
      const node = this.graph.node(id) as GraphNode;
      if (node) {
        node.x -= node.width / 2;
        node.y -= node.height / 2;
      }
    });
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    Array.from(this.nodes.values()).forEach((node) => {
      if (!node) return;
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}

export function mapAlignToRankdir(align: PlatformLayoutAlign): "TB" | "LR" {
  switch (align) {
    case PlatformLayoutAlign.CENTER:
      return "TB"; // Vertical layout: top → bottom
    case PlatformLayoutAlign.START:
    default:
      return "LR"; // Horizontal layout: left → right
  }
}
