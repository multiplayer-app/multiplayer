import { EdgePosition } from "@multiplayer/types";
import type Edge from "../../../components/Edge";

export class GraphEdge {
  id: string;
  source: string;
  target: string;
  sourcePosition: EdgePosition;
  targetPosition: EdgePosition;

  constructor(edge: Edge) {
    this.id = edge.id;
    // if edge is grouped and group is collapsed use group id, otherwise use the source or target node id
    this.source = edge.rootSource.id;
    this.target = edge.rootTarget.id;
    this.sourcePosition = edge.sourcePosition;
    this.targetPosition = edge.targetPosition;
  }
}
