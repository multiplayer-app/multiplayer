import {
  Component,
  ComponentType,
  Edge,
  RadarComponentTypeOrder,
} from "@multiplayer/types";
import { EntityWithMeta } from "shared/models/interfaces";
import { COLUMN_WIDTH, ROW_HEIGHT } from "../configs";

interface Node {
  in: string[];
  out: string[];
  type: string;
  name: string;
  id: string;
}

export enum LayoutType {
  GROUP = "GROUP",
  DIRECTED = "DIRECTED",
}

type Position = { x: number; y: number };
export class GraphPlatform {
  private nodes: Record<string, Node> = {};

  constructor(
    edges: Edge[],
    nodes: Component[],
    entities: Map<string, EntityWithMeta>
  ) {
    this.init(edges, nodes, entities);
  }

  public calculatePositions(
    layoutType: LayoutType,
    params: {
      rowHeight: number;
      colWidth: number;
      offsetX?: number;
      offsetY?: number;
    } = {
      rowHeight: ROW_HEIGHT,
      colWidth: COLUMN_WIDTH,
      offsetX: 0,
      offsetY: 0,
    }
  ) {
    if (!Object.values(this.nodes).length) return {};

    let positions = {};
    switch (layoutType) {
      case LayoutType.DIRECTED:
        positions = this.buildLeftToRightLayout();
        break;
      case LayoutType.GROUP:
        positions = this.buildGroupedLayout(params.rowHeight / params.colWidth);
        break;
    }

    return this.adjustPositions(positions, params);
  }

  private adjustPositions(
    positions: Record<string, Position>,
    params: {
      rowHeight: number;
      colWidth: number;
      offsetX?: number;
      offsetY?: number;
    }
  ) {
    Object.values(positions).forEach((position) => {
      position.x = position.x * params.colWidth + params.offsetX || 0;
      position.y = position.y * params.rowHeight + params.offsetY || 0;
    });
    return positions;
  }

  private addEdge(source: string, target: string) {
    if (this.nodes[source]) this.nodes[source].out.push(target);
    if (this.nodes[target]) this.nodes[target].in.push(source);
  }

  private addNode(node: string, type: string, name: string) {
    this.nodes[node] = { in: [], out: [], type, id: node, name };
  }

  private init(
    edges: Edge[],
    nodes: Component[],
    entities: Map<string, EntityWithMeta>
  ) {
    nodes.forEach(({ id, linkedTo }) =>
      this.addNode(
        id,
        entities.get(linkedTo)?.metadata?.type,
        entities.get(linkedTo)?.key
      )
    );

    edges.forEach((edge) => {
      if (
        !edge.source ||
        !edge.target ||
        edge.source === "undefined" ||
        edge.target === "undefined"
      ) {
        return;
      }
      this.addEdge(edge.source, edge.target);
    });
  }

  private selectStartNodes(): string[] {
    if (!Object.keys(this.nodes).length) {
      return [];
    }
    const sorted = Object.keys(this.nodes).sort((keyL, keyR) => {
      const compareIn = this.nodes[keyL].in.length - this.nodes[keyR].in.length;
      if (compareIn === 0) {
        return this.nodes[keyR].out.length - this.nodes[keyL].out.length;
      }
      return compareIn;
    });
    if (!this.nodes[sorted[0]].in.length) {
      return sorted.filter((key) => !this.nodes[key].in.length); // return all nodes without incoming connections
    }
    return [sorted[0]];
  }

  private matrix(rows: number, cols: number) {
    return Array.from(Array(rows), (row) =>
      Array.from(Array(cols), (cell) => "")
    );
  }

  private buildGroupedLayout(columnProportions: number) {
    const groups: Record<ComponentType, Node[]> = Object.values(
      this.nodes
    ).reduce((acc, node) => {
      if (!acc[node.type]) acc[node.type] = [];
      acc[node.type].push(node);
      return acc;
    }, {} as Record<ComponentType, Node[]>);

    Object.keys(groups).forEach((type) => {
      groups[type] = groups[type].sort((l: Node, r: Node) =>
        (l.name || "").localeCompare(r.name)
      );
    });
    const size = Object.keys(this.nodes).length;
    const board: string[][] = this.matrix(size, size);
    const positions: Record<string, { x: number; y: number }> = {};

    const MAX_GROUP_WITHOUT_COLUMNS = 7;

    const maxGroupSize = Object.values(groups).sort(
      (g1, g2) => g2.length - g1.length
    )[0].length;
    const rows =
      maxGroupSize < MAX_GROUP_WITHOUT_COLUMNS
        ? maxGroupSize
        : Math.floor(Math.sqrt(maxGroupSize / columnProportions));

    const addGroup = (group: Node[] | undefined, startX = 0) => {
      if (!group) return startX;

      group.forEach((node, index) => {
        const x = startX + Math.floor(index / rows);
        const y = index % rows;
        board[y][x] = node.id;
        positions[node.id] = { x, y };
      });

      return startX + Math.ceil(group.length / rows);
    };

    RadarComponentTypeOrder.reduce((x: number, type: ComponentType) => {
      return addGroup(groups[type], x);
    }, 0);

    return positions;
  }

  private buildLeftToRightLayout() {
    const startNodes = this.selectStartNodes();
    const size = Object.keys(this.nodes).length;
    const board: string[][] = this.matrix(size, size);
    const positions: Record<string, { x: number; y: number }> = {};

    const placeNode = (
      node: string,
      startPosition: { x: number; y: number }
    ) => {
      if (positions[node]) {
        return undefined;
      }
      let x = startPosition.x;
      let y = startPosition.y;

      if (board[y][x]) {
        while (board[y][x]) {
          ++y;
        }
      }
      board[y][x] = node;
      positions[node] = { x, y };
      let yj = positions[node].y;
      this.nodes[node].out.forEach((nextNode, j) => {
        const placed = placeNode(nextNode, { x: positions[node].x + 1, y: yj });
        if (placed) {
          yj = placed.y + 1;
        }
      });

      return positions[node];
    };

    let y = 0;
    startNodes.forEach((node, i) => {
      const placed = placeNode(node, { x: 0, y });
      if (placed) {
        y = placed.y + 1;
      }
    });

    return positions;
  }
}
