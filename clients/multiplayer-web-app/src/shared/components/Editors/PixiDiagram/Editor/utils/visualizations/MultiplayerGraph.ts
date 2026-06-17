import {
  EdgeDirection,
  PlatformLayoutAlign,
  PlatformLayoutDirection,
} from "@multiplayer/types";

import { IGraphLayout, IGraphLayoutOptions } from "./IGraphLayout";
import { GraphNode, GraphEdge } from "./components";
import { ACTUAL_GRID_SIZE, COLUMN_WIDTH } from "../../configs";

export class MultiplayerGraph implements IGraphLayout {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  options: IGraphLayoutOptions;

  constructor(options: IGraphLayoutOptions) {
    this.nodes = new Map();
    this.edges = new Map();
    this.options = {
      ...options,
      offsetX: options.offsetX ?? 0,
      offsetY: options.offsetY ?? 0,
      gridSize: options.gridSize ?? ACTUAL_GRID_SIZE,
      minTrashHold: options.minTrashHold ?? COLUMN_WIDTH,
      align: options.align || PlatformLayoutAlign.START,
    };
  }

  setEdges(edges: GraphEdge[]): void {
    this.edges = new Map(edges.map((e) => [e.id, e]));
  }

  setNodes(nodes: GraphNode[]) {
    this.nodes = new Map(nodes.map((n) => [n.id, n]));
  }

  layout() {
    const { align, rowGap, colGap, direction, oldDirection } = this.options;

    if (oldDirection && direction !== oldDirection) {
      this._rotateNodesForDirectionChange(direction, oldDirection);
      this._updateEdgeDirections(direction);
    }

    const nodes = Array.from(this.nodes.values());

    if (direction === PlatformLayoutDirection.HORIZONTAL) {
      this._layoutHorizontal(nodes, rowGap, colGap, align);
    } else {
      this._layoutVertical(nodes, colGap * 0.8, rowGap, align);
    }
  }

  private _layoutHorizontal(
    nodes: GraphNode[],
    rowGap: number,
    colGap: number,
    align: PlatformLayoutAlign
  ) {
    let cols: GraphNode[][] = [];
    let currentColumn: GraphNode[] = [];

    nodes.sort((a, b) => a.x - b.x);

    const columnThreshold = this._calculateThreshold(nodes);

    nodes.forEach((node) => {
      if (currentColumn.length === 0) {
        currentColumn.push(node);
      } else {
        let lastNodeInColumn = currentColumn[currentColumn.length - 1];
        if (Math.abs(node.x - lastNodeInColumn.x) <= columnThreshold) {
          currentColumn.push(node);
        } else {
          cols.push(currentColumn);
          currentColumn = [node];
        }
      }
    });

    if (currentColumn.length > 0) {
      cols.push(currentColumn);
    }
    const [heights, maxHeight] = this._getMaximumSize(cols, "height", rowGap);

    let newX = this.options.offsetX;

    cols.forEach((col, colIndex) => {
      let newY = this.options.offsetY;
      col.sort((a, b) => a.y - b.y);

      const colHeight = heights[colIndex];

      if (align === PlatformLayoutAlign.CENTER) {
        newY = (maxHeight - colHeight) / 2 + this.options.offsetY;
      }

      col.forEach((node) => {
        this._setPosition(node.id, newX, newY);
        newY += this._normalizeSize(node.height) + rowGap;
      });

      const maxWidth = Math.max(...col.map((node) => node.width));
      newX += this._normalizeSize(maxWidth) + colGap;
    });
  }

  private _layoutVertical(
    nodes: GraphNode[],
    rowGap: number,
    colGap: number,
    align: PlatformLayoutAlign
  ) {
    let rows: GraphNode[][] = [];
    let currentRow: GraphNode[] = [];

    nodes.sort((a, b) => a.y - b.y);
    const rowThreshold = this._calculateVerticalThreshold(nodes);

    nodes.forEach((node) => {
      if (currentRow.length === 0) {
        currentRow.push(node);
      } else {
        let lastNodeInRow = currentRow[currentRow.length - 1];
        if (Math.abs(node.y - lastNodeInRow.y) <= rowThreshold) {
          currentRow.push(node);
        } else {
          rows.push(currentRow);
          currentRow = [node];
        }
      }
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    const [widths, maxWidth] = this._getMaximumSize(rows, "width", colGap);
    let newY = this.options.offsetY;

    rows.forEach((row, rowIndex) => {
      let newX = this.options.offsetX;
      row.sort((a, b) => a.x - b.x);

      const rowWidth = widths[rowIndex];

      if (align === PlatformLayoutAlign.CENTER) {
        newX = (maxWidth - rowWidth) / 2 + this.options.offsetX;
      }

      row.forEach((node) => {
        this._setPosition(node.id, newX, newY);
        newX += this._normalizeSize(node.width) + colGap;
      });

      const maxHeight = Math.max(...row.map((node) => node.height));
      newY += this._normalizeSize(maxHeight) + rowGap;
    });
  }

  private _setPosition(id: string, x: number, y: number) {
    const node = this.nodes.get(id);
    if (node) {
      node.x = x;
      node.y = y;
    }
  }

  private _calculateThreshold(nodes: GraphNode[]): number {
    let extraGap = 0;
    const { minTrashHold, gridSize } = this.options;

    const [minX, maxX] = nodes.reduce<[number, number]>(
      ([currentMinX, currentMaxX], node, index) => {
        if (index === 0) return [node.x, node.x];

        const prevNode = nodes[index - 1];
        const deltaX = node.x - (prevNode.x + prevNode.width);

        if (deltaX > minTrashHold) {
          extraGap += deltaX - minTrashHold;
        }

        const adjustedX = node.x - extraGap;
        return [
          Math.min(currentMinX, node.x),
          Math.max(currentMaxX, adjustedX),
        ];
      },
      [Infinity, -Infinity]
    );

    const threshold = Math.abs(Math.ceil((maxX - minX) / minTrashHold));
    return Math.max(threshold, 3) * gridSize;
  }

  private _calculateVerticalThreshold(nodes: GraphNode[]): number {
    let extraGap = 0;
    const { minTrashHold, gridSize } = this.options;

    const [minY, maxY] = nodes.reduce<[number, number]>(
      ([currentMinY, currentMaxY], node, index) => {
        if (index === 0) return [node.y, node.y];

        const prevNode = nodes[index - 1];
        const deltaY = node.y - (prevNode.y + prevNode.height);

        if (deltaY > minTrashHold) {
          extraGap += deltaY - minTrashHold;
        }

        const adjustedY = node.y - extraGap;
        return [
          Math.min(currentMinY, node.y),
          Math.max(currentMaxY, adjustedY),
        ];
      },
      [Infinity, -Infinity]
    );

    const threshold = Math.abs(Math.ceil((maxY - minY) / minTrashHold));
    return Math.max(threshold, 2) * gridSize;
  }

  private _getMaxColumnHeight(columns: GraphNode[][]): number {
    const { rowGap } = this.options;
    return Math.max(
      ...columns.map((col) =>
        col.reduce(
          (sum, node) => sum + this._normalizeSize(node.height) + rowGap,
          -rowGap
        )
      ),
      0
    );
  }

  private _getMaxRowWidth(rows: GraphNode[][]): number {
    const { colGap } = this.options;
    return Math.max(
      ...rows.map((row) =>
        row.reduce(
          (sum, node) => sum + this._normalizeSize(node.width) + colGap,
          -colGap
        )
      ),
      0
    );
  }

  private _updateEdgeDirections(direction: PlatformLayoutDirection) {
    if (direction === PlatformLayoutDirection.VERTICAL) {
      this.edges.forEach((edge) => {
        edge.sourcePosition = EdgeDirection.bottom;
        edge.targetPosition = EdgeDirection.top;
      });
    } else {
      this.edges.forEach((edge) => {
        edge.sourcePosition = EdgeDirection.right;
        edge.targetPosition = EdgeDirection.left;
      });
    }
  }
  private _rotateNodesForDirectionChange(
    newDirection: PlatformLayoutDirection,
    oldDirection: PlatformLayoutDirection
  ) {
    if (newDirection === oldDirection) return;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    this.nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + node.width);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const nodes = Array.from(this.nodes.values());

    if (oldDirection === PlatformLayoutDirection.HORIZONTAL) {
      const cols = this._groupNodesByX(nodes);

      cols.forEach((col) => {
        col.sort((a, b) => a.y - b.y);
        col.forEach((node) => {
          const oldX = node.x;
          const oldY = node.y;

          node.x = oldY;
          node.y = oldX;
        });
      });
    } else {
      const rows = this._groupNodesByY(nodes);

      rows.forEach((row) => {
        row.sort((a, b) => a.x - b.x);
        row.forEach((node) => {
          const oldX = node.x;
          const oldY = node.y;

          node.x = oldY;
          node.y = oldX;
        });
      });
    }
  }

  private _groupNodesByX(nodes: GraphNode[]): GraphNode[][] {
    let cols: GraphNode[][] = [];
    let currentColumn: GraphNode[] = [];

    nodes.sort((a, b) => a.x - b.x);
    const columnThreshold = this._calculateThreshold(nodes);

    nodes.forEach((node) => {
      if (currentColumn.length === 0) {
        currentColumn.push(node);
      } else {
        let lastNodeInColumn = currentColumn[currentColumn.length - 1];
        if (Math.abs(node.x - lastNodeInColumn.x) <= columnThreshold) {
          currentColumn.push(node);
        } else {
          cols.push(currentColumn);
          currentColumn = [node];
        }
      }
    });

    if (currentColumn.length > 0) {
      cols.push(currentColumn);
    }

    return cols;
  }

  private _groupNodesByY(nodes: GraphNode[]): GraphNode[][] {
    let rows: GraphNode[][] = [];
    let currentRow: GraphNode[] = [];

    nodes.sort((a, b) => a.y - b.y);
    const rowThreshold = this._calculateVerticalThreshold(nodes);

    nodes.forEach((node) => {
      if (currentRow.length === 0) {
        currentRow.push(node);
      } else {
        let lastNodeInRow = currentRow[currentRow.length - 1];
        if (Math.abs(node.y - lastNodeInRow.y) <= rowThreshold) {
          currentRow.push(node);
        } else {
          rows.push(currentRow);
          currentRow = [node];
        }
      }
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }

  private _getMaximumSize(
    arr: GraphNode[][],
    sizeKey: "height" | "width",
    gap: number
  ): [number[], number] {
    const sizes = arr.map((col) =>
      col.reduce(
        (sum, node) => sum + this._normalizeSize(node[sizeKey]) + gap,
        -gap
      )
    );

    return [sizes, Math.max(...sizes)];
  }

  private _normalizeSize(size: number) {
    return size;
    // const { snapGrig = true, gridSize } = this.options;
    // return Math.floor(size / gridSize) * gridSize;
  }

  public getBounds(): { x: number; y: number; width: number; height: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.nodes.forEach((node) => {
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
