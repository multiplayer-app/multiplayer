import { Observable } from "lib0/observable";
import { Container, Graphics, DisplayObject } from "pixi.js";
import { DiagramEvents, SelectionEvents } from "../../types";
import { roundDecimal } from "../../helpers";
import { DiagramProvider } from "../../services";
import { getDiagramTheme } from "../../theme";

export interface SelectionPoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ISelectionCompleteData {
  points: SelectionPoints;
}

const initialPoints = { x1: -1, y1: -1, x2: -1, y2: -1 };

export default class Selection extends Observable<SelectionEvents> {
  public container: Container;
  private isMultiselect = false;
  private _points = { ...initialPoints };

  private _isStarted = false;
  public get isStarted(): boolean {
    return this._enabled && this._isStarted;
  }
  public set isStarted(v: boolean) {
    this._isStarted = v;
  }

  private _enabled = true;
  public get enabled(): boolean {
    return this._enabled;
  }
  public set enabled(v: boolean) {
    this._enabled = v;
  }

  constructor() {
    super();
    this.container = new Container();
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  start(point, isMultiselect): void {
    if (!this.enabled) return;

    this.isStarted = true;
    this.isMultiselect = isMultiselect;

    this._points.x1 = point.x;
    this._points.y1 = point.y;
    this._points.x2 = point.x;
    this._points.y2 = point.y;
  }

  update(point, event): void {
    if (!this.isStarted || event?.pointerType === "touch") return;
    this._points.x2 = point.x;
    this._points.y2 = point.y;
    this.render();
  }

  end(): void {
    if (!this.isStarted) return;
    this.cleanup();
    this.isStarted = false;
    this.emit(DiagramEvents.selection_end, [
      this.getShape(),
      this.isMultiselect,
    ]);
    this._points = { ...initialPoints };
  }

  appendTo(parent: Container) {
    parent.addChild(this.container as unknown as DisplayObject);
  }

  private cleanup(): void {
    this.container.removeChildren();
  }

  private render(): void {
    this.cleanup();

    const points = this.normalizePoints();

    const rect = new Graphics();

    const { selection } = getDiagramTheme();
    rect.lineStyle(1 / DiagramProvider.viewport.scaled, selection.color, 0.5);
    rect.beginFill(selection.color, 0.2);
    rect.drawRect(
      points.x1,
      points.y1,
      points.x2 - points.x1,
      points.y2 - points.y1
    );
    rect.endFill();
    this.container.addChild(rect as unknown as DisplayObject);
  }

  private normalizePoints() {
    return {
      x1: Math.min(this._points.x1, this._points.x2),
      y1: Math.min(this._points.y1, this._points.y2),
      x2: Math.max(this._points.x1, this._points.x2),
      y2: Math.max(this._points.y1, this._points.y2),
    };
  }
  private getShape() {
    const { x1, y1, x2, y2 } = this.normalizePoints();
    return {
      x: x1,
      y: y1,
      width: roundDecimal(x2 - x1),
      height: roundDecimal(y2 - y1),
    };
  }
}
