import { Container } from "pixi.js";
import { DEFAULT_LAYOUT, PlatformLayout } from "@multiplayer/types";

import { animatePosition } from "./animations";
import { GraphEdge, GraphNode, Graphs } from "./visualizations";

import type Edge from "../components/Edge";
import type { PlatformNode } from "../types";
import type YDocManager from "../YDocManager";
import type { NodesContainer } from "../components/Containers";

import { COLUMN_WIDTH, ACTUAL_GRID_SIZE } from "../configs";
import { config } from "../../../../../../config";

// Split calculate plus local animation and sync
export async function calculateAutoLayout(
  nodesContainer: NodesContainer,
  edgesContainer: Container | null,
  yDocManager: YDocManager,
  options: Partial<{
    sync: boolean;
    animate: boolean;
    layout: PlatformLayout;
    snapGrig?: boolean;
    gridSize?: boolean;
    minTrashHold?: number;
    oldLayout?: Partial<PlatformLayout>;
  }> = {}
): Promise<void> {
  if (!nodesContainer) return;
  const {
    sync,
    animate,
    snapGrig,
    layout = {},
    oldLayout = {},
    gridSize = ACTUAL_GRID_SIZE,
    minTrashHold = COLUMN_WIDTH,
  } = options;
  const { algorithm, direction, align } = { ...DEFAULT_LAYOUT, ...layout };

  const { children, rowGap, colGap } = nodesContainer;
  const nodes = children as PlatformNode[];
  const edges = (edgesContainer?.children as Edge[]) || [];

  const graph = new Graphs[algorithm]({
    rowGap,
    colGap,
    align,
    gridSize,
    snapGrig,
    direction,
    minTrashHold,
    oldDirection: oldLayout.direction,
  });

  graph.setNodes(nodes.map((n) => new GraphNode(n as PlatformNode)));

  graph.setEdges(
    edges.filter((e) => e.source && e.target).map((edge) => new GraphEdge(edge))
  );

  graph.layout();
  const animationPromises: Promise<void>[] = [];

  yDocManager.transact(() => {
    edges.forEach((edge: Edge) => {
      const { sourcePosition, targetPosition } = graph.edges.get(edge.id);
      yDocManager.updateEdge(edge.id, { sourcePosition, targetPosition });
    });

    nodes.forEach((node: PlatformNode) => {
      const { x, y } = graph.nodes.get(node.id);
      const newX = Math.round(x);
      const newY = Math.round(y);

      if (isNaN(newX) || isNaN(newY)) {
        if (config.REACT_APP_PLATFORM_ENV !== "production") {
          alert("Some of props is NaN");
        }
        return;
      }

      if (!node.dragging) {
        const syncPos = sync && !node.isDeleted && !node.isReadonly;
        const newState = { x: newX, y: newY };

        if (syncPos) {
          yDocManager.updateState(node.id, newState);
        }

        const animatePromise = new Promise<void>(async (resolve) => {
          const onAnimate = () => {
            node.emit("updated");
          };
          if (!animate) {
            node.position.set(newState.x, newState.y);
            onAnimate();
          } else {
            await animatePosition(
              node.position,
              newState,
              100,
              true,
              onAnimate
            );
          }
          resolve();
        });

        animationPromises.push(animatePromise);
      }
    });
  });

  await Promise.all(animationPromises);
}
