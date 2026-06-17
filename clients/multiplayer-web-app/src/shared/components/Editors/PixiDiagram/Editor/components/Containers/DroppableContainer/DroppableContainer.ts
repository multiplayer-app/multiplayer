import { Container, Graphics } from "pixi.js";

class DroppableContainer extends Container {
  private dropArea: Graphics;

  constructor() {
    super();
    this.eventMode = "static";

    this.on("pointerup", this._onPointerUp);
    this.on("pointerenter", this._onPointerEnter);
    this.on("pointerleave", this._onPointerLeave);
    this.on("childAdded", this.updateRect.bind(this));
    this.on("childRemoved", this.updateRect.bind(this));
  }

  private _onPointerEnter(event) {}

  private _onPointerLeave(event) {}

  private _onPointerUp(event) {}

  private updateRect(event) {}
}

export default DroppableContainer;
