import { Observable } from "lib0/observable";
import { Container, DisplayObject } from "pixi.js";
import { EdgeDirection } from "@multiplayer/types";

import ConnectionPoint from "./ConnectionPoint";
import { animateAlpha } from "../../utils/animations";
import { DiagramEvents } from "../../types";

export default class ConnectionPoints extends Observable<
  "click" | DiagramEvents.new_edge_source | DiagramEvents.new_edge_target
> {
  container: Container = new Container();
  dragstart: boolean;
  dragging: boolean;

  constructor(private parentNode) {
    super();

    Object.values(EdgeDirection).forEach((direction) => {
      const connectionPoint = new ConnectionPoint({ direction, parentNode });
      connectionPoint.on("click", (e) => {
        e.stopPropagation();
        this.emit("click", [direction]);
      });
      connectionPoint.on("pointerdown", this._onDragStart);
      connectionPoint.on("pointerenter", this._onPointErenter);
      connectionPoint.on("pointerleave", this._onPointLeave);
      connectionPoint.appendTo(this.container);
    });
    this.container.alpha = 0;
  }

  private _onDragStart = (e) => {
    this.dragstart = true;
    e.target.on("pointermove", this._onDragMove);
    e.target.on("pointerup", this._onDragEnd);
    e.target.on("pointerupoutside", this._onDragEnd);
  };

  private _onDragEnd = (e) => {
    this.dragstart = false;
    this.dragging = false;
  };

  private _onDragMove = (e) => {
    if (!e.pressure || !this.dragstart || this.dragging) return;
    this.dragging = true;
    const connectionPoint = e.target;
    this.emit(DiagramEvents.new_edge_source, [e, connectionPoint.direction]);
  };

  private _onPointErenter = (e) => {
    if (!e.pressure) return;
    const connectionPoint = e.target;
    this.emit(DiagramEvents.new_edge_target, [connectionPoint.direction]);
  };

  private _onPointLeave = (e) => {
    if (!e.pressure) return;
    this.emit(DiagramEvents.new_edge_target, []);
  };

  appendTo(parent: Container) {
    // const overlayContainer = DiagramProvider.stage.overlayContainer;
    // const globalPos = parent.toGlobal(overlayContainer.position);
    // const localPos = overlayContainer.toLocal(globalPos);
    // this.container.position.set(localPos.x, localPos.y);
    // overlayContainer.addChild(this.container as unknown as DisplayObject);

    parent.addChild(this.container as unknown as DisplayObject);

    animateAlpha(this.container, 1, 100);
  }

  destroy(): void {
    super.destroy();
    this.container.removeChildren();
    this.container.destroy();
  }
}
