import { Container } from "pixi.js";

class NonDraggableContainer extends Container {
  constructor() {
    super();
    this.eventMode = "static";
    this.on("pointerdown", this._onDragStart);
  }

  private _onDragStart = (e): void => {
    e.stopPropagation();
  };
}

export default NonDraggableContainer;
