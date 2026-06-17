import { Container } from "pixi.js";

class SelectableContainer extends Container {
  private _clickTimeout: any;
  private _isPointerDown: boolean;

  constructor() {
    super();
    this.eventMode = "static";
    this._clickTimeout = null;
    this._isPointerDown = false;
    this.cursor = "pointer";

    this.on("pointerup", this._onPointerUp);
    this.on("pointerdown", this._onPointerDown);
    this.on("pointerupoutside", this._onPointerUpOutside);
  }

  onSelectionChange() { }

  private _onPointerDown(event) {
    this._isPointerDown = true;
  }

  private _onPointerUp(event) {
    if (this._isPointerDown) {
      this._handleClick(event);
      if (this._clickTimeout) {
        clearTimeout(this._clickTimeout);
        this._clickTimeout = null;
        this._handleDoubleClick(event);
      } else {
        this._clickTimeout = setTimeout(() => {
          this._clickTimeout = null;
        }, 200);
      }
    }
    this._isPointerDown = false;
  }

  private _onPointerUpOutside() {
    this._isPointerDown = false;
    if (this._clickTimeout) {
      clearTimeout(this._clickTimeout);
      this._clickTimeout = null;
    }
  }

  private _handleClick(e) {
    this.emit("select", e);
  }

  private _handleDoubleClick(e) {
    this.emit("dblclick", e);
  }
}

export default SelectableContainer;
