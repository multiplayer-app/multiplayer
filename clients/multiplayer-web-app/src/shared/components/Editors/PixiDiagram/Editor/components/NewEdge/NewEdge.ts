import { Observable } from "lib0/observable";
import { Container, DisplayObject, Point } from "pixi.js";
import Edge from "../Edge";
import ComponentNode from "../ComponentNode";
import { DiagramEvents, NewEdgeEvents } from "../../types";
import { EdgeDirection } from "@multiplayer/types";

export default class NewEdge extends Observable<NewEdgeEvents> {
  edge: Edge;
  targetPoint: Point;
  target: ComponentNode;
  targetPosition: EdgeDirection;
  container: Container;
  isStarted: boolean;
  hasTarget: boolean;

  constructor() {
    super();
    this.container = new Container();
  }

  start(source: ComponentNode, sourcePosition: EdgeDirection, point) {
    this.targetPoint = new Point(point.x, point.y);
    this.edge = new Edge({
      id: "new",
      source,
      sourcePosition,
      targetPoint: this.targetPoint,
    });
    this.isStarted = true;
    this.edge.graphic.eventMode = "none";
    this.edge.appendTo(this.container);
  }

  end(e) {
    if (this.edge) {
      this.emit(DiagramEvents.edge_creation_end, [
        {
          source: this.edge.source,
          sourcePosition: this.edge.sourcePosition,
          targetPoint: this.targetPoint.clone(),
          targetObject: e.target,
        },
      ]);
    }
    this.container.removeChildren();
    this.isStarted = false;
    this.edge = null;
    this.targetPoint = null;
  }

  update(point) {
    if (!this.isStarted || this.hasTarget) return;
    this.targetPoint.set(point.x, point.y);
    this.edge.renderEdge();
  }

  setTarget(target, direction = EdgeDirection.left) {
    this.hasTarget = target && target !== this.edge.source;
    if (!this.isStarted || !this.hasTarget) return;
    const point = this.edge.getPointByNode(target, direction);
    this.edge.targetPosition = direction;
    this.targetPoint.set(point.x, point.y);
    this.edge.renderEdge();
  }

  appendTo(parent: Container) {
    parent.addChild(this.container as unknown as DisplayObject);
  }
}
