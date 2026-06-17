import {
  DisplayObject,
  FederatedPointerEvent,
  Container,
  Graphics,
  Rectangle,
} from "pixi.js";
import { ComponentType, EntityCommitChangeType } from "@multiplayer/types";
import { Shape, Intersection } from "kld-intersections";

import { BaseNodeType, DiagramEvents } from "../../types";
import { DiagramProvider } from "../../services";
import { DraggableContainer } from "../Containers";
import { isCtrlKeyPressed, boundsToShape, isInside } from "../../helpers";

import ChangeTypeRect from "../ChangeTypeRect";

import {
  IComponentNodeData,
  IPlatformGroupData,
} from "shared/models/interfaces";

class BaseNode<T> extends DraggableContainer<BaseNode<T>> {
  private _isDeleted = false;
  private _isSelected = false;
  private _isHighlighted = true;
  private _changeType: EntityCommitChangeType;
  changeTypeRect: ChangeTypeRect | null = null;
  rect: Graphics;

  private _type: BaseNodeType = ComponentType.GENERIC;
  public get type(): BaseNodeType {
    return this._type;
  }
  public set type(v: BaseNodeType) {
    this._type = v;
  }

  constructor(
    private _data: IComponentNodeData | IPlatformGroupData,
    opt: any
  ) {
    super(opt);
    this.type = _data.type;
    this.changeType = _data.changeType;
    this.rect = new Graphics();

    this.on("select", this.selectNode);
    this.on("dblclick", this.openNode);
  }

  // Getters and Setters
  get isReadonly(): boolean {
    return (
      this.isDeleted || !DiagramProvider.isEditable || this._data.isReadonly
    );
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }
  set isDeleted(value: boolean) {
    this._isDeleted = value;
  }

  get isSelected(): boolean {
    return this._isSelected;
  }
  set isSelected(value: boolean) {
    if (this._isSelected !== value) {
      this._isSelected = value;
      this.onSelectionChange();
      this.emit(DiagramEvents.selected, value);
    }
  }

  get isSelectable(): boolean {
    return !this.isDeleted && (!this.groupNode || !this.groupNode.isCollapsed);
  }

  get changeType(): EntityCommitChangeType {
    return this._changeType;
  }
  set changeType(value: EntityCommitChangeType) {
    this._changeType = value;
    if (value === EntityCommitChangeType.DELETE) {
      this.dragEnabled = false;
      this.isDeleted = true;
    } else {
      this.dragEnabled = DiagramProvider.isEditable;
      this.isDeleted = false;
    }
  }

  get isHighlighted(): boolean {
    return this._isHighlighted;
  }
  set isHighlighted(value: boolean) {
    if (this._isHighlighted !== value) {
      this._isHighlighted = value;
      this.updateAlphaAndFilters();
    }
  }

  // Node Actions
  openNode = (e: FederatedPointerEvent): void => {
    if (!this.isDeleted) {
      DiagramProvider.openNode<BaseNode<T>>(this);
    }
  };

  selectNode = (e: FederatedPointerEvent): void => {
    if (this.dragging) return;
    const isMultiselect = isCtrlKeyPressed(e);
    if (this.isSelected) {
      DiagramProvider.deselectNode(this, isMultiselect);
    } else {
      DiagramProvider.selectNode<BaseNode<T>>(this, isMultiselect);
    }
  };

  // Intersection and Bounds
  isIntersects(selectionShape: Shape, offset: number = 0): boolean {
    if (!this.isSelectable) return false;
    const bounds = this.getRealBounds();
    const shape = boundsToShape(bounds, "rectangle", offset);
    const intersections = Intersection.intersect(selectionShape, shape);
    return intersections.points.length > 0 || isInside(selectionShape, shape);
  }

  hasPoint(point: { x: number; y: number }): boolean {
    if (!this.isSelectable) return false;

    const bounds = this.getRealBounds();
    return (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    );
  }

  getLocalSize() {
    const { width, height } = this.rect.getLocalBounds();
    return { width, height };
  }

  getRealBounds(includeGroupPosition = true): {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  } {
    const { x, y } = includeGroupPosition
      ? this.getGroupedPosition()
      : this.position;
    // TODO: use toLocal toGlobal like here
    const { width, height } = this.getLocalBounds();
    return {
      x,
      y,
      width,
      height,
      top: y,
      left: x,
      right: x + width,
      bottom: y + height,
    };
  }

  getGroupedPosition(): { x: number; y: number } {
    const container = DiagramProvider.stage.nodesContainer;
    const globalPos = this.toGlobal(container.position);
    return container.toLocal(globalPos);
  }

  // Update Functions
  appendTo(parent: Container): void {
    parent.addChild(this as unknown as DisplayObject);
  }

  update(data: IComponentNodeData | IPlatformGroupData): void {
    this.type = data.type;
    this.changeType = data.changeType;
    if (data.state) {
      this.position.set(data.state.x, data.state.y);
    }
  }

  renderChangeTypeRect(width: number, height: number, radius: number): void {
    if (this.changeTypeRect) {
      this.changeTypeRect.destroy();
      this.changeTypeRect = null;
    }

    if (!this.changeType) return;

    this.changeTypeRect = new ChangeTypeRect(
      this.changeType,
      width,
      height,
      radius
    );
    this.changeTypeRect.appendTo(this);
  }

  updateAlphaAndFilters = (): void => {
    if (!this.isHighlighted && !this.isSelected) {
      this.alpha = 0.4;
    } else if (this._data.isPassive) {
      this.alpha = 0.5;
    } else {
      this.alpha = 1;
    }
    if (this.alpha < 1) {
      this.parentLayer = DiagramProvider.stage.baseLayer;
    } else {
      this.parentLayer = null;
    }
  };

  getLocalBounds(rect?: Rectangle, skipChildrenUpdate?: boolean): Rectangle {
    const bounds = super.getLocalBounds(rect, skipChildrenUpdate);
    const rectBounds = this.getLocalSize();
    bounds.width = rectBounds.width;
    bounds.height = rectBounds.height;

    return bounds;
  }
}

export default BaseNode;
