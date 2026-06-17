import { PlatformLayoutAlgorithm } from "@multiplayer/types";

import { DagreGraph } from "./DagreGraph";
import { MultiplayerGraph } from "./MultiplayerGraph";

export * from "./components";

export const Graphs = {
  [PlatformLayoutAlgorithm.TREE]: DagreGraph,
  [PlatformLayoutAlgorithm.FLOW]: MultiplayerGraph,
};
export { getCombinedGraphLayout } from "./CombinedGraph";
