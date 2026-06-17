import { IGraphLayoutOptions } from "./IGraphLayout";
import { GraphNode } from "./components";
import { DagreGraph } from "./DagreGraph";
import { MultiplayerGraph } from "./MultiplayerGraph";

export function getCombinedGraphLayout(
  options: IGraphLayoutOptions,
  nodes: GraphNode[],
  edges: { source: string; target: string }[]
) {
  const treeLayout = new DagreGraph({
    offsetX: options.offsetX,
    offsetY: options.offsetY,
    rowGap: options.rowGap,
    colGap: options.colGap,
    direction: options.direction,
    align: options.align,
  });

  treeLayout.setNodes(nodes);
  treeLayout.setEdges(edges);
  treeLayout.layout();

  const multiplayerLayout = new MultiplayerGraph({
    offsetX: options.offsetX,
    offsetY: options.offsetY,
    rowGap: options.rowGap,
    colGap: options.colGap,
    direction: options.direction,
    align: options.align,
  });

  multiplayerLayout.setNodes(
    nodes.map((n) => {
      n.x = treeLayout.nodes.get(n.id).x;
      n.y = treeLayout.nodes.get(n.id).y;
      return n;
    })
  );

  multiplayerLayout.setEdges([]);
  multiplayerLayout.layout();

  return multiplayerLayout;
}
