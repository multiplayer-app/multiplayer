import {
  Polygon,
  Graphics,
  Container,
  DisplayObject,
  IDestroyOptions,
} from "pixi.js";
import { Intersection, Shape } from "kld-intersections";
import { EdgePosition, EdgeDirection } from "@multiplayer/types";

import { DiagramProvider } from "../../services";
import { GRID_SIZE, INSTANCE_CHANGES_STYLES } from "../../configs";
import { getDiagramTheme } from "../../theme";
import { calculateOffsetPoints } from "../../utils/line-to-polygon";
import { EdgeOptions, PlatformNode, DiagramEvents } from "../../types";
import { isInside, boundsToShape, isCtrlKeyPressed } from "../../helpers";
import { getSmoothStepSegments } from "../../utils/edges/smoothstep-edge";

import type GroupNode from "../GroupNode";
import type ComponentNode from "../ComponentNode";
import { getDefaultEdgePosition } from "../../utils/edges/general";

let maxIndex = 99999;

export class Edge extends Container {
  id: string;
  graphic: Graphics = new Graphics();
  data: EdgeOptions;
  source: ComponentNode;
  target: ComponentNode;
  sourcePosition: EdgePosition;
  targetPosition: EdgePosition;

  private _listeners = [];
  private _prevIndex = this.zIndex;
  private _isSelected: boolean = false;
  private _hitAreaPoints: Array<[number, number]> = [];

  get currentSource(): ComponentNode | GroupNode {
    return this.source && this.source.groupNode?.isCollapsed
      ? this.source.groupNode
      : this.source;
  }

  get currentTarget(): ComponentNode | GroupNode {
    return this.target && this.target.groupNode?.isCollapsed
      ? this.target.groupNode
      : this.target;
  }

  get rootSource(): ComponentNode | GroupNode {
    return this.source?.groupNode || this.source;
  }

  get rootTarget(): ComponentNode | GroupNode {
    return this.target?.groupNode || this.target;
  }

  public get isDeleted(): boolean {
    return this.data.isDeleted;
  }
  public set isDeleted(v: boolean) {
    this.data.isDeleted = v;
  }

  public get isSelected(): boolean {
    return this._isSelected;
  }
  public set isSelected(v: boolean) {
    if (this._isSelected === v || this.isDeleted) return;
    this._isSelected = v;
    if (this._isSelected) {
      this._prevIndex = this.zIndex;
      this.zIndex = maxIndex++;
    } else {
      this.zIndex = this._prevIndex;
    }
    this.renderEdge();
  }

  private _isHighlighted = true;
  public get isHighlighted(): boolean {
    return this._isHighlighted;
  }
  public set isHighlighted(v: boolean) {
    const old = this._isHighlighted;
    this._isHighlighted = v;
    if (old !== v) {
      this.updateAlpha();
    }
  }

  constructor(options: EdgeOptions) {
    super();
    this.data = { offset: 6, borderRadius: 16, ...options };

    this.id = options.id;
    this.source = options.source;
    this.sourcePosition =
      this.data.sourcePosition ||
      getDefaultEdgePosition("source", DiagramProvider.layout.direction);

    this.target = options.target;
    this.targetPosition =
      this.data.targetPosition ||
      getDefaultEdgePosition("target", DiagramProvider.layout.direction);

    this.graphic.cursor = "pointer";
    this.graphic.eventMode =
      this.isDeleted || !DiagramProvider.isEditable ? "none" : "static";

    if (!this.source) {
      return;
    }

    this.graphic.on("added", this.renderEdge);
    this.graphic.on("pointerdown", this.onSelect.bind(this));
    this._addListeners();
    this.addChild(this.graphic as unknown as DisplayObject);
  }

  toJson() {
    return {
      id: this.id,
      source: this.source.id,
      target: this.target.id,
    };
  }

  update(data): void {
    this.data = { ...this.data, ...data };
    this.sourcePosition = this.data.sourcePosition || EdgeDirection.right;
    this.targetPosition = this.data.targetPosition || EdgeDirection.left;

    // TODO: improve isDeleted logic
    this.graphic.eventMode =
      this.isDeleted || !DiagramProvider.isEditable ? "none" : "static";
    this._addListeners();
    this.renderEdge();
  }

  onSelect(e): void {
    e.stopPropagation();
    const isMultiselect = isCtrlKeyPressed(e);
    if (this.isSelected) {
      DiagramProvider.deselectEdge(this, isMultiselect);
    } else {
      DiagramProvider.selectEdge(this, isMultiselect);
    }
  }

  onRefSelect = (selected: boolean): void => {
    this.isSelected = selected;
  };

  renderEdge = (e?): void => {
    // DiagramProvider.cacheAsBitmap(false, this.graphic);
    this.graphic.clear();
    this._hitAreaPoints = [];
    if (!this.source) return;

    try {
      const { point: source, node: sourceNode } = this.getSource();
      const { point: target, node: targetNode } = this.getTarget();

      if (sourceNode === targetNode && (sourceNode as GroupNode).isCollapsed) {
        return;
      }

      this.drawPath(source.x, source.y, target.x, target.y);
      this.drawArrow(target.x, target.y);
      this.drawHitArea();
      // DiagramProvider.cacheAsBitmap(true, this.graphic);
    } catch (error) {
      console.error(error);
    }
  };

  setStyle() {
    const colorByChangeType = INSTANCE_CHANGES_STYLES[this.data.changeType];
    const { edge } = getDiagramTheme();
    const color = colorByChangeType
      ? colorByChangeType.stroke
      : this._isSelected
      ? edge.selectedColor
      : edge.color;

    this.graphic.lineStyle(2, color, 1);
  }

  drawPath(sourceX, sourceY, targetX, targetY) {
    this.setStyle();
    const [segments] = getSmoothStepSegments({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: this.sourcePosition,
      targetPosition: this.targetPosition,
      offset: GRID_SIZE - this.data.offset,
      borderRadius: this.data.borderRadius,
    });

    segments.forEach(({ code, x, y, x1, y1, x2, y2 }) => {
      switch (code) {
        case "M":
          this._moveTo(x, y);
          break;
        case "L":
          this._lineTo(x, y);
          break;
        case "Q":
          this._curveTo(x1, y1, x, y);
          break;
        case "C":
          this.graphic.bezierCurveTo(x1, y1, x2, y2, x, y);
          break;
      }
    });
  }

  drawArrow(tX, tY) {
    const offsetX = 10;
    const offsetY = 10;

    this.graphic.moveTo(tX, tY);
    switch (this.targetPosition) {
      case EdgeDirection.top:
        this.graphic.lineTo(tX - offsetX, tY - offsetY);
        this.graphic.moveTo(tX, tY);
        this.graphic.lineTo(tX + offsetX, tY - offsetY);
        break;
      case EdgeDirection.bottom:
        this.graphic.lineTo(tX + offsetX, tY + offsetY);
        this.graphic.moveTo(tX, tY);
        this.graphic.lineTo(tX - offsetX, tY + offsetY);
        break;
      case EdgeDirection.right:
        this.graphic.lineTo(tX + offsetX, tY - offsetY);
        this.graphic.moveTo(tX, tY);
        this.graphic.lineTo(tX + offsetX, tY + offsetY);
        break;
      case EdgeDirection.left:
      default:
        this.graphic.lineTo(tX - offsetX, tY - offsetY);
        this.graphic.moveTo(tX, tY);
        this.graphic.lineTo(tX - offsetX, tY + offsetY);
        break;
    }
  }

  drawHitArea() {
    const offsetPoints = this._hitAreaPoints.length
      ? calculateOffsetPoints(this._hitAreaPoints, 5)
      : [];
    this.graphic.hitArea = new Polygon(offsetPoints);
    // // To visualize hitArea uncomment code below
    // drawGraphicsHitArea(this.graphic, offsetPoints);
  }

  getSource() {
    return {
      node: this.currentSource,
      point: this.getPointByNode(this.currentSource, this.sourcePosition),
    };
  }

  getTarget() {
    if (!this.target) {
      return { point: this.data.targetPoint };
    }
    return {
      node: this.currentTarget,
      point: this.getPointByNode(this.currentTarget, this.targetPosition),
    };
  }

  getPointByNode(
    node: ComponentNode | GroupNode,
    position: EdgePosition
  ): { x: number; y: number } {
    const { offset } = this.data;

    let { x, y, width, height } = node.getRealBounds();
    // const { width, height } = node.rect.getLocalBounds();
    switch (position) {
      case EdgeDirection.right:
        return { x: x + width + offset, y: y + height / 2 };
      case EdgeDirection.left:
        return { x: x - offset, y: y + height / 2 };
      case EdgeDirection.top:
        return { x: x + width / 2, y: y - offset };
      case EdgeDirection.bottom:
        return { x: x + width / 2, y: y + height + offset };
      default:
        return { x, y }; // TODO: calc rect if position auto
    }
  }

  isIntersects(selectionShape: Shape) {
    const polygon = this.graphic.hitArea as Polygon;
    if (this.isDeleted || this.destroyed || !polygon?.points?.length) {
      return false;
    }
    const path = boundsToShape(polygon.points, "path");
    const shape = boundsToShape(this.getRealBounds(), "rectangle");
    const intersections = Intersection.intersect(selectionShape, path);

    const a =
      intersections.points.length > 0 || isInside(selectionShape, shape);
    return a;
  }

  isConnectedWith(node) {
    return this.currentSource === node || this.currentTarget === node;
  }

  appendTo(parent: Container) {
    parent.addChild(this as unknown as DisplayObject);
  }

  private _lineTo(x: number, y: number) {
    this.graphic.lineTo(x, y);
    this._hitAreaPoints.push([x, y]);
  }

  private _moveTo(x: number, y: number) {
    this.graphic.moveTo(x, y);
    this._hitAreaPoints.push([x, y]);
  }

  private _curveTo(x1: number, y1: number, x2: number, y2: number) {
    this.graphic.quadraticCurveTo(x1, y1, x2, y2);
    this._hitAreaPoints.push([x1, y1]);
  }

  private getRealBounds() {
    const { x, y } = this.getGlobalPosition();
    const { width, height } = this.graphic.getBounds();
    return { x, y, width, height };
  }

  private updateAlpha = () => {
    // DiagramProvider.cacheAsBitmap(false, this.graphic);
    if (!this.isHighlighted) {
      this.alpha = 0.7;
    } else {
      this.alpha = 1;
    }
    if (this.alpha < 1) {
      this.parentLayer = DiagramProvider.stage.baseLayer;
    } else {
      this.parentLayer = null;
    }
    // DiagramProvider.cacheAsBitmap(true, this.graphic);
  };

  destroy = (options?: boolean | IDestroyOptions): void => {
    this._removeListeners();
    super.destroy(options);
  };

  private _addListeners() {
    this._removeListeners();
    this._addConnectionEventsListener(this.source);
    this._addConnectionEventsListener(this.target);
  }

  private _addConnectionEventsListener(obj: ComponentNode) {
    if (obj) {
      this._addListener(obj, "destroyed", this.destroy);
      this._addListener(obj, "updated", this.renderEdge);
      this._addListener(obj, DiagramEvents.selected, this.onRefSelect);

      if (obj.groupNode) {
        this._addListener(obj.groupNode, "updated", this.renderEdge);
        this._addListener(
          obj.groupNode,
          DiagramEvents.selected,
          this.onRefSelect
        );
      }
    }
  }

  private _removeListeners() {
    for (const [emitter, event, handler] of this._listeners) {
      emitter.off(event, handler);
    }
    this._listeners = [];
  }

  private _addListener(
    emitter: PlatformNode,
    event: string,
    handler: (...args: any[]) => void
  ) {
    if (!emitter || !event || !handler) return;
    emitter.on(event, handler);
    this._listeners.push([emitter, event, handler]);
  }
}

