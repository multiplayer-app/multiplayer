import { ComponentMetadata, ComponentType } from "@multiplayer/types";
import { Assets, Container, DisplayObject, Sprite, Texture } from "pixi.js";

import { COMPONENT_ICON_BY_TYPE, COMPONENT_ICON_SIZE } from "../../configs";

class NodeIcon extends Container {
  private sprite: Sprite | null = null;

  constructor(
    private meta: ComponentMetadata,
    private size = COMPONENT_ICON_SIZE
  ) {
    super();
  }

  private async loadTexture(): Promise<Texture> {
    if (this.meta.iconUrl) {
      try {
        const res = await Assets.load(this.meta.iconUrl);
        if (res instanceof Texture) {
          return res;
        } else {
          throw new Error("Invalid icon URL");
        }
      } catch (error) {
        console.warn(`Failed to load icon from URL: ${this.meta.iconUrl}.`);
      }
    }
    try {
      return await Assets.load(
        COMPONENT_ICON_BY_TYPE[this.meta.type || ComponentType.GENERIC] ||
        COMPONENT_ICON_BY_TYPE[ComponentType.GENERIC]
      );
    } catch (error) {
      console.error(`Failed to load default icon for type: ${this.meta.type}.`);
    }
  }

  async renderIcon(): Promise<void> {
    const texture = await this.loadTexture();

    if (this.sprite) {
      this.removeChild(this.sprite as unknown as DisplayObject);
    }

    this.sprite = new Sprite(texture);
    this.sprite.width = this.size;
    this.sprite.height = this.size;
    this.pivot.set(0, this.size / 2);
    this.addChild(this.sprite as unknown as DisplayObject);
  }
}

export default NodeIcon;
