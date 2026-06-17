import { UndoManager } from "yjs";
import debounce from "lodash.debounce";
import { Container, DisplayObject, Polygon, Rectangle } from "pixi.js";
import { IPlatformGroupData } from "shared/models/interfaces";

import {
  COMPONENT_GAP,
  COMPONENT_WIDTH,
  COMPONENT_HEIGHT,
  COMPONENT_RADIUS,
  COMPONENT_ICON_SIZE,
  SYNC_THROTTLING,
  GROUP_INFO_HEIGHT,
  GROUP_COLUMN_GAP,
  GROUP_ROW_GAP,
} from "../../configs";

import { getColorSet } from "../../helpers";
import type YDocManager from "../../YDocManager";
import { DiagramProvider } from "../../services";
import { getDiagramTheme } from "../../theme";
import { getGroupHitArea } from "../../utils/hit-area";

import Text from "../Text";
import BaseNode from "../BaseNode";
import EmptyBox from "../EmptyBox";
import NodeIcon from "../NodeIcon";
import IconButton from "../IconButton";
import { NodesContainer } from "../Containers";

const GAP = COMPONENT_GAP;
const INFO_HEIGHT = GROUP_INFO_HEIGHT;
const INNER_WIDTH = COMPONENT_WIDTH - GAP * 2;
class GroupNode extends BaseNode<GroupNode> {
  id: string;
  name: string;
  nameNode: Text;
  icon: NodeIcon;
  button: IconButton;
  descriptionNode: Text;
  infoContainer: Container;
  nodesContainer: NodesContainer;
  emptyBox: EmptyBox;
  childNodes: Set<any> = new Set();

  private _isCollapsed = false;
  get isCollapsed(): boolean {
    if (!this.state$) return this._isCollapsed;
    return this.state$.get("collapsed");
  }

  set isCollapsed(v: boolean) {
    this._isCollapsed = v;
    if (this.state$ && this.state$.get("collapsed") !== this._isCollapsed) {
      this.state$.set("collapsed", this._isCollapsed);
    }
  }

  get styles() {
    const isActive = this.isSelected || this.dragStart;
    const { fill, stroke, textColor } = getColorSet(
      DiagramProvider.viewMode,
      this.data.color,
      "group",
      this.isSelected
    );

    return {
      fill,
      stroke,
      textColor,
      strokeOpacity: 0.6,
      strokeWidth: isActive ? 2 : 1,
      fillOpacity: isActive || this.isCollapsed ? 0.9 : 0.6,
    };
  }

  constructor(
    public data: IPlatformGroupData,
    public yDocManager: YDocManager
  ) {
    super(data, {
      id: data.id,
      yManager: yDocManager,
      state: data.state,
      states$: yDocManager?.states$,
    });

    this.id = data.id;
    this.name = data.name;
    this.sortableChildren = true;

    this.infoContainer = new Container();
    this.nodesContainer = new NodesContainer();
    this.infoContainer.zIndex = 1;
    this.nodesContainer.zIndex = 2;
    this.nodesContainer.rowGap = GROUP_ROW_GAP;
    this.nodesContainer.colGap = GROUP_COLUMN_GAP;

    this.infoContainer.name = "InfoContainer";
    this.nodesContainer.name = "GroupNodeContainer";

    this.infoContainer.position.set(GAP, GAP);
    this.nodesContainer.position.set(GAP, INFO_HEIGHT + GAP * 3);

    this.renderNode();
    this.addChild(this.infoContainer as unknown as DisplayObject);
    this.addChild(this.nodesContainer as unknown as DisplayObject);

    this.setObservers();
  }

  toJson() {
    return {
      ...this.data,
      state: {
        x: this.position.x,
        y: this.position.y,
        collapsed: this.isCollapsed,
      },
    };
  }

  observeStateChange = ({ keysChanged }, tr) => {
    if (keysChanged.has("collapsed")) {
      this.onCollapseChange(tr.local);
    }
  };

  addChildNode(node): void {
    this.childNodes.add(node);
    node.groupNode = this;
    if (!this.isCollapsed) {
      this.nodesContainer.addChild(node);
    }
    this.updateGroupDebounce();
  }

  removeChildNode(node): void {
    this.childNodes.delete(node);
    node.groupNode = null;
    node.off("updated", this.onChildNodeMove);
    if (!this.isCollapsed) {
      this.nodesContainer.removeChild(node);
    }
    this.updateGroupDebounce();
  }

  update(data) {
    super.update(data);
    this.id = data.id;
    this.name = data.name;
    this.data = { ...data };

    this.renderNode();
    this.setObservers();
  }

  toggleCollapse = (): void => {
    this.isCollapsed = !this.isCollapsed;
  };

  onSelectionChange(): void {
    this.updateRect();
  }

  onDragStateChange(state: boolean) {
    this.updateRect();
  }

  onChildNodeMove = (origin): void => {
    if (origin instanceof UndoManager) {
      // Temporary fix to handle issue where the node update emitter triggers before group layout recalculates during an undo operation
      this.updateRectDebounce();
    } else {
      this.updateRect();
    }
  };

  renderNode(): void {
    this.renderInfo();
    this.renderRect();
    this.renderChildNodes();
  }

  renderChildNodes(): void {
    if (this.isCollapsed) {
      this.nodesContainer.removeChildren();
    } else {
      if (this.childNodes.size) {
        this.childNodes.forEach((node) => {
          this.nodesContainer.addChild(node);
        });
      }
    }
    this.updateGroup();
  }

  private renderRect(): void {
    this.rect.name = "Background";
    this.rect.eventMode = "none";
    this.rect.parentLayer = DiagramProvider.stage.baseLayer;

    this.addChild(this.rect as unknown as DisplayObject);
    this.updateRect();
  }

  private renderEmptyRect(): void {
    if (this.emptyBox) {
      this.emptyBox.destroy();
      this.emptyBox = null;
    }

    if (this.isCollapsed || this.nodesContainer.children.length) return;
    this.emptyBox = new EmptyBox(
      {
        width: COMPONENT_WIDTH,
        height: COMPONENT_HEIGHT,
      },
      "Drag and drop components into this group."
    );
    this.emptyBox.position.set(this.nodesContainer.x, this.nodesContainer.y);
    this.emptyBox.appendTo(this);
  }

  updateRect = (): void => {
    const { fill, stroke, fillOpacity, strokeWidth, strokeOpacity } =
      this.styles;
    this.rect.clear();
    this.rect.beginFill(fill, fillOpacity);
    this.rect.lineStyle(strokeWidth, stroke, strokeOpacity, 0);
    const [w, h] = this.getRectSize();
    this.rect.drawRoundedRect(0, 0, w, h, COMPONENT_RADIUS);
    this.rect.endFill();
    const { height } = this.infoContainer.getLocalBounds();
    this.infoContainer.hitArea = new Polygon(getGroupHitArea(GAP, w, height));
    this.button?.position.set(w - GAP * 2, INFO_HEIGHT / 2);

    this.rect.parentLayer =
      this.isCollapsed || this.dragStart
        ? null
        : DiagramProvider.stage.baseLayer;

    this.renderChangeTypeRect(
      this.rect.width,
      this.rect.height,
      COMPONENT_RADIUS
    );
  };

  private renderInfo(): void {
    this.infoContainer.removeChildren();
    this.renderIcon();
    this.renderName();
    if (!this.isDeleted) {
      this.renderCollapseButton();
    }
  }

  private async renderIcon(): Promise<void> {
    this.icon = new NodeIcon({ type: "group", iconUrl: this.data.iconUrl });
    await this.icon.renderIcon();
    this.icon.pivot.set(0, 0);
    this.infoContainer.addChild(this.icon as unknown as DisplayObject);
  }

  private renderName(): void {
    const { textColor } = this.styles;
    const textStyle = {
      fill: textColor,
      fontWeight: "500",
      maxWidth: INNER_WIDTH - COMPONENT_ICON_SIZE * 2,
    };
    this.nameNode = new Text(this.data.name, textStyle);
    this.nameNode.alpha = 0.75;
    this.nameNode.anchor.set(0, 0);
    this.nameNode.position.set(GAP / 2 + COMPONENT_ICON_SIZE, 2);
    this.nameNode.appendTo(this.infoContainer);
  }

  private renderCollapseButton(): void {
    if (this.button) this.button.destroy();
    const icon = this.isCollapsed ? `expand-node.svg` : `collapse-node.svg`;
    this.button = new IconButton(icon, { fill: getDiagramTheme().groupNode.iconFill, size: 24 });
    this.button.pivot.set(24, 12);
    this.infoContainer.addChild(this.button as unknown as DisplayObject);
    this.button.on("pointerdown", this.toggleCollapse);
    const { right } = this.rect.getLocalBounds();
    this.button.position.set(right - GAP * 2, INFO_HEIGHT / 2);
  }

  private getRectSize(): [number, number] {
    const minW = INNER_WIDTH;
    const minH = 0;

    const c = this.getNodesContainerBounds();

    const w1 = Math.max(minW, c.width + c.x);

    const h1 = INFO_HEIGHT - 1;
    const h2 = Math.max(minH, c.height + c.y);

    const h = h1 + h2 + (h2 ? GAP * 4 : GAP * 2);
    const w = w1 + GAP * 2;

    return [w, h];
  }

  private getNodesContainerBounds() {
    if (this.emptyBox) {
      return this.emptyBox.getLocalBounds();
    }

    if (!this.nodesContainer.children.length) {
      return this.nodesContainer.getLocalBounds();
    }

    let x1 = Infinity,
      x2 = -Infinity,
      y1 = Infinity,
      y2 = -Infinity;

    this.nodesContainer.children.forEach((node) => {
      const { x, y } = node;
      const { width, height } = node.getLocalBounds();
      x1 = Math.min(x1, x);
      x2 = Math.max(x2, x + width);
      y1 = Math.min(y1, y);
      y2 = Math.max(y2, y + height);
    });

    return new Rectangle(x1, y1, x2 - x1, y2 - y1);
  }

  private async onCollapseChange(isLocal): Promise<void> {
    const { width: initialW, height: initialH } = this.getLocalBounds();
    this.renderCollapseButton();
    this.renderChildNodes();
    this.emit("updated", this.isCollapsed);

    if (isLocal) {
      await DiagramProvider.updateContainerLayout(
        this.nodesContainer,
        false,
        true
      );
      const { width, height } = this.getLocalBounds();
      this.syncState({ width, height });
      const diffW = width - initialW;
      const diffH = height - initialH;

      if (DiagramProvider.isAutoLayout) {
        DiagramProvider.updateContainerLayout(
          this.parent as NodesContainer,
          true,
          false
        );
      } else {
        DiagramProvider.moveNearbyNodes(this, diffW, diffH);
      }
    }
  }

  private updateGroupDebounce = debounce(
    () => {
      this.updateGroup();
    },
    100,
    { leading: false }
  );

  updateRectDebounce = debounce(
    () => {
      this.updateRect();
    },
    SYNC_THROTTLING,
    { leading: false }
  );

  private updateGroup(): void {
    this.updateListeners();
    this.renderEmptyRect();
    this.updateRect();
  }

  private updateListeners(): void {
    this.nodesContainer.children.forEach((node) => {
      node.off("updated", this.onChildNodeMove);
      if (this.childNodes.has(node) && !this.isCollapsed) {
        node.on("updated", this.onChildNodeMove);
      }
    });
  }

  private setObservers(): void {
    if (this.state$ && this.yDocManager) {
      this.yDocManager.observe(this.state$, this.observeStateChange);
    }
  }
}

export default GroupNode;
