import {
  Assets,
  ColorSource,
  Container,
  DisplayObject,
  Graphics,
  Sprite,
} from "pixi.js";
import { ICON_PATH } from "../../configs";
import { NonDraggableContainer } from "../Containers";
import { getDiagramTheme } from "../../theme";

export type IconType = string;

export interface IconButtonOptions {
  size: number;
  iconSize: number;
  fill: ColorSource;
}

function getDefaultOptions(): IconButtonOptions {
  return {
    size: 32,
    iconSize: 24,
    fill: getDiagramTheme().iconButton.fill,
  };
}

export default class IconButton extends NonDraggableContainer {
  rect: Graphics;
  icon: Sprite;
  options: IconButtonOptions;

  constructor(
    private type: IconType,
    options: Partial<IconButtonOptions> = {}
  ) {
    super();
    this.name = type;
    this.cursor = "pointer";
    this.eventMode = "static";
    this.options = { ...getDefaultOptions(), ...options };
    this.pivot.set(0, this.options.size / 2);
    this.renderRect();
    this.renderIcon();
    this.on("mouseenter", this.onmouseEnter.bind(this));
    this.on("mouseleave", this.onmouseLeave.bind(this));
  }

  private renderRect() {
    if (!this.options.fill) return;
    this.rect = new Graphics();
    this.rect.beginFill(this.options.fill, 1);
    this.rect.drawRoundedRect(0, 0, this.options.size, this.options.size, 4);
    this.rect.endFill();
    this.rect.alpha = 0.2;
    this.addChild(this.rect as unknown as DisplayObject);
  }

  private async renderIcon() {
    const texture = await Assets.load(`${ICON_PATH}/${this.type}`);
    this.icon = new Sprite(texture);
    this.icon.width = this.options.iconSize;
    this.icon.height = this.options.iconSize;
    const sizeDiff = (this.options.size - this.options.iconSize) / 2;
    this.icon.x = sizeDiff;
    this.icon.y = sizeDiff;
    this.addChild(this.icon as unknown as DisplayObject);
  }

  private onmouseEnter() {
    if (this.rect) {
      this.rect.alpha = 1;
    }
  }

  private onmouseLeave() {
    if (this.rect) {
      this.rect.alpha = 0.2;
    }
  }

  appendTo(parent: Container) {
    parent.addChild(this as unknown as DisplayObject);
  }
}
