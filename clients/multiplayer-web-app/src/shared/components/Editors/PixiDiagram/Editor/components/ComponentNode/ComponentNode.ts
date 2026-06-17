import { ComponentMetadata } from "@multiplayer/types";
import {
  Polygon,
  Container,
  DisplayObject,
  FederatedPointerEvent,
} from "pixi.js";

import { ChangesViewMode } from "shared/models/enums";
import { ClientState, IComponentNodeData } from "shared/models/interfaces";

import {
  COMPONENT_GAP,
  COMPONENT_WIDTH,
  COMPONENT_HEIGHT,
  COMPONENT_RADIUS,
  COMPONENT_ICON_SIZE,
} from "../../configs";
import YDocManager from "../../YDocManager";
import { getColorSet } from "../../helpers";
import { DiagramEvents } from "../../types";
import { DiagramProvider } from "../../services";
import { getNodeHitArea } from "../../utils/hit-area";

import Text from "../Text";
import Presence from "../Presence";
import BaseNode from "../BaseNode";
import NodeIcon from "../NodeIcon";
import RadarIcon from "../RadarIcon";
import IconButton from "../IconButton";
import ConnectionPoints from "../ConnectionPoints";

class ComponentNode extends BaseNode<ComponentNode> {
  id: string;
  icon: NodeIcon;
  radarIcon: RadarIcon;
  linkedTo: string;
  presence: Presence;
  container: Container;
  connectionPoints: ConnectionPoints;
  connectionPointsTimeout: any;
  metadata: ComponentMetadata;
  _viewMode: ChangesViewMode;

  private _name: string;
  public get name(): string {
    return this._name;
  }
  public set name(v: string) {
    this._name = v;
  }

  get styles() {
    const isActive = this.isSelected || this.dragStart;
    const { fill, stroke, textColor } = getColorSet(
      DiagramProvider.viewMode,
      this.metadata.color,
      this.type,
      this.isSelected
    );

    return {
      fill,
      stroke,
      textColor,
      strokeOpacity: 0.6,
      strokeWidth: isActive ? 2 : 1,
      fillOpacity: isActive ? 1 : 0.9,
    };
  }

  constructor(
    public data: IComponentNodeData,
    public yDocManager?: YDocManager
  ) {
    super(data, {
      id: data.id,
      state: data.state,
      yManager: yDocManager,
    });

    // this.cullable = true;
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.groupId = data.groupId;
    this.linkedTo = data.linkedTo;
    this.metadata = data.data || { type: data.type };
    this.changeType = data.changeType;
    this.width = COMPONENT_WIDTH;
    this.height = COMPONENT_HEIGHT;
    this.container = new Container();
    this.container.sortableChildren = true;

    if (data.isReadonly) {
      this.dragEnabled = false;
    }

    this.addChild(this.container as unknown as DisplayObject);
    this.renderNode();
    this.addListeners();
    if (this.yDocManager) {
      this.renderPresence();
    }
  }

  toJson() {
    return {
      ...this.data,
      state: { x: this.position.x, y: this.position.y },
    };
  }

  update(data: IComponentNodeData): void {
    super.update(data);
    this.data = data;
    this.type = data.type;
    this.name = data.name;
    this.groupId = data.groupId;

    this.metadata = data.data || { type: data.type };

    this.renderNode();
  }

  updatePresence(states: ClientState[]) {
    this.presence.update(states);
    this.presence.y = this.rect.height / 2 - this.presence.height / 2;
    this.presence.x = this.rect.width - this.presence.width - COMPONENT_GAP;
  }

  onSelectionChange(): void {
    this.renderRect();
  }

  onDragStateChange(state: boolean) {
    this.renderRect();
  }

  cleanupNodeContainer() {
    this.destroyConnectionPoints();
    this.container.removeChildren();

    this.icon?.destroy();
    this.radarIcon?.destroy();
    this.icon = null;
    this.radarIcon = null;
  }

  async renderNode(): Promise<void> {
    this.cleanupNodeContainer();
    this.renderRect();
    this.renderResetButton();
    this.renderChangeTypeRect(
      this.rect.width,
      this.rect.height,
      COMPONENT_RADIUS
    );
    this.renderIcon();
    this.renderRadarIcon();
    this.renderName();
    this.updateAlphaAndFilters();
  }

  private addListeners() {
    this.on("pointerenter", this.handleMouseOver.bind(this));
    this.on("pointerleave", this.handleMouseLeave.bind(this));

    if (!this.yDocManager) return;
    this.on("updated", this.handleMove.bind(this));
  }

  private handleMouseOver(event: FederatedPointerEvent) {
    if (event.pressure && !DiagramProvider.stage.newEdge.isStarted) return;
    this.renderConnectionPoints();
  }

  private handleMouseLeave() {
    this.destroyConnectionPoints();
  }

  private handleMove(e): void {
    this.destroyConnectionPoints();
  }

  private renderRect(): void {
    const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity } =
      this.styles;
    this.rect.clear();
    this.rect.zIndex = -1;
    this.rect.beginFill(fill, fillOpacity);
    this.rect.lineStyle(strokeWidth, stroke, strokeOpacity, 0);
    const w = COMPONENT_WIDTH;
    const h = COMPONENT_HEIGHT;
    const r = COMPONENT_RADIUS;
    this.rect.drawRoundedRect(0, 0, w, h, r);
    this.updateHitArea();
    this.rect.endFill();
    this.container.addChild(this.rect as unknown as DisplayObject);
  }

  private renderName(): void {
    const left = COMPONENT_ICON_SIZE + COMPONENT_GAP + COMPONENT_GAP / 2;
    const { width } = this.rect.getLocalBounds();
    const radarIconWidth = this.radarIcon?.size || 0;

    const textStyle = {
      fontWeight: "500",
      fill: this.styles.textColor,
      maxWidth: width - left - radarIconWidth - COMPONENT_GAP,
    };

    const textNode = new Text(this.name, textStyle);
    textNode.alpha = 0.75;
    textNode.position.set(left, COMPONENT_HEIGHT / 2);
    textNode.appendTo(this.container);
  }

  private async renderRadarIcon(): Promise<void> {
    if (this.data.detectionId) {
      this.radarIcon = new RadarIcon();
      this.radarIcon.renderIcon();
      this.radarIcon.y = COMPONENT_HEIGHT / 2;
      this.radarIcon.x = COMPONENT_WIDTH - this.radarIcon.size - COMPONENT_GAP;
      this.container.addChild(this.radarIcon as unknown as DisplayObject);
    } else {
      this.radarIcon?.destroy();
    }
  }

  private async renderIcon(): Promise<void> {
    this.icon = new NodeIcon(this.metadata);
    await this.icon.renderIcon();
    this.icon.x = COMPONENT_GAP;
    this.icon.y = COMPONENT_HEIGHT / 2;

    this.container.addChild(this.icon as unknown as DisplayObject);
  }

  private renderResetButton(): void {
    if (this.isDeleted) {
      const button = new IconButton("restore.png", { fill: this.styles.fill });
      button.position.set(
        this.container.width - button.width - COMPONENT_GAP,
        COMPONENT_HEIGHT / 2
      );
      button.appendTo(this.container);
      button.on("click", () => {
        DiagramProvider.editor.restoreDeletedNode(this);
      });
    }
  }

  private renderConnectionPoints() {
    clearTimeout(this.connectionPointsTimeout);
    if (
      this.connectionPoints ||
      this.dragging ||
      this.isReadonly ||
      !this.isHighlighted ||
      !this.yDocManager.isAllView ||
      DiagramProvider.selection.isStarted
    ) {
      return;
    }

    this.connectionPointsTimeout = setTimeout(() => {
      this.connectionPoints = new ConnectionPoints(this);
      this.zIndex = 9999;

      this.connectionPoints.on("click", (direction) => {
        DiagramProvider.addNode(this, direction);
      });

      this.connectionPoints.on(DiagramEvents.new_edge_source, (e, dir) => {
        DiagramProvider.stage.createNewEdge(this, e, dir);
      });

      this.connectionPoints.on(DiagramEvents.new_edge_target, (dir) => {
        if (dir) {
          DiagramProvider.stage.updateNewEdge(this, dir);
        } else {
          DiagramProvider.stage.updateNewEdge(null, null);
        }
      });

      this.connectionPoints.appendTo(this);
    }, 150);
  }

  private destroyConnectionPoints() {
    clearTimeout(this.connectionPointsTimeout);
    if (!this.connectionPoints) return;
    this.connectionPoints.destroy();
    this.connectionPoints = null;
    this.zIndex = 0;
  }

  private renderPresence() {
    this.presence = new Presence();
    this.presence.appendTo(this);
  }

  private updateHitArea = () => {
    const { width, height } = this.rect.getLocalBounds();
    const offset = this.isReadonly ? 0 : 32;
    const hitAreaPoints = getNodeHitArea(width, height, offset);
    this.rect.hitArea = new Polygon(hitAreaPoints);
    // drawGraphicsHitArea(this.rect, hitAreaPoints);
  };
}

export default ComponentNode;
